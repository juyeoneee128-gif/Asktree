import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import { callClaude } from '../analysis/claude-client';
import { ANALYSIS_MODELS } from '../analysis/models';
import {
  ASSESS_FEATURES_TOOL,
  ASSESS_FEATURES_SYSTEM,
  buildAssessMessage,
} from './prompts';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type FeatureStatus = 'implemented' | 'partial' | 'unimplemented' | 'attention';
const VALID_STATUSES = new Set<string>(['implemented', 'partial', 'unimplemented', 'attention']);

export interface AssessResult {
  assessed_count: number;
  stats: {
    total: number;
    implemented: number;
    partial: number;
    unimplemented: number;
    attention: number;
    implementation_rate: number;
  };
  token_usage: { input: number; output: number };
  warnings: string[];
}

/**
 * 기획서 기능 vs 세션 로그를 대조하여 구현 현황을 판정합니다.
 */
export async function assessFeatures(projectId: string): Promise<AssessResult> {
  const supabase = createAdminClient();
  const warnings: string[] = [];

  // 1. 기능 목록 조회
  const { data: features } = await supabase
    .from('spec_features')
    .select('id, name, total_items, prd_summary')
    .eq('project_id', projectId);

  if (!features || features.length === 0) {
    return {
      assessed_count: 0,
      stats: { total: 0, implemented: 0, partial: 0, unimplemented: 0, attention: 0, implementation_rate: 0 },
      token_usage: { input: 0, output: 0 },
      warnings: ['No features to assess'],
    };
  }

  // 2. 세션 로그 조회
  const { data: sessions } = await supabase
    .from('sessions')
    .select('title, summary, changed_files')
    .eq('project_id', projectId)
    .order('number', { ascending: true });

  const sessionData = (sessions ?? []).map((s) => ({
    title: s.title,
    summary: s.summary,
    changed_files: Array.isArray(s.changed_files) ? (s.changed_files as string[]) : [],
  }));

  // 3. Claude API 호출
  const userMessage = buildAssessMessage({
    features: features.map((f) => ({
      id: f.id,
      name: f.name,
      total_items: f.total_items,
      prd_summary: f.prd_summary,
    })),
    sessions: sessionData,
  });

  const result = await callClaude({
    systemPrompt: ASSESS_FEATURES_SYSTEM,
    userMessage,
    tools: [ASSESS_FEATURES_TOOL],
    maxTokens: 4096,
    model: ANALYSIS_MODELS.ASSESS_FEATURES,
  });

  // 4. 응답 파싱 + UPDATE
  let assessedCount = 0;
  const featureIds = new Set(features.map((f) => f.id));

  for (const input of result.toolInputs) {
    const assessments = input.assessments;
    if (!Array.isArray(assessments)) continue;

    for (const raw of assessments) {
      const a = raw as Record<string, unknown>;
      const featureId = a.feature_id as string;
      const status = a.status as string;

      if (!featureIds.has(featureId)) {
        warnings.push(`Unknown feature_id: ${featureId}`);
        continue;
      }

      if (!VALID_STATUSES.has(status)) {
        warnings.push(`Invalid status "${status}" for feature ${featureId}`);
        continue;
      }

      const implementedItems = Array.isArray(a.implemented_items) ? a.implemented_items : [];
      const relatedFiles = Array.isArray(a.related_files) ? a.related_files : [];

      const { error } = await supabase
        .from('spec_features')
        .update({
          status: status as FeatureStatus,
          implemented_items: implementedItems as Database['public']['Tables']['spec_features']['Update']['implemented_items'],
          related_files: relatedFiles as Database['public']['Tables']['spec_features']['Update']['related_files'],
        })
        .eq('id', featureId);

      if (error) {
        warnings.push(`Failed to update feature ${featureId}: ${error.message}`);
      } else {
        assessedCount++;
      }
    }
  }

  // 5. 통계 계산
  const { data: updatedFeatures } = await supabase
    .from('spec_features')
    .select('status')
    .eq('project_id', projectId);

  const all = updatedFeatures ?? [];
  const stats = {
    total: all.length,
    implemented: all.filter((f) => f.status === 'implemented').length,
    partial: all.filter((f) => f.status === 'partial').length,
    unimplemented: all.filter((f) => f.status === 'unimplemented').length,
    attention: all.filter((f) => f.status === 'attention').length,
    implementation_rate: 0,
  };

  if (stats.total > 0) {
    stats.implementation_rate = Math.round(
      ((stats.implemented + stats.partial * 0.5) / stats.total) * 100
    );
  }

  return {
    assessed_count: assessedCount,
    stats,
    token_usage: result.tokenUsage,
    warnings,
  };
}
