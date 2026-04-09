import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import { callClaude } from '../analysis/claude-client';
import {
  REVERSE_IA_TOOL,
  REVERSE_IA_SYSTEM,
  buildReverseIAMessage,
} from './prompts';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface ReverseFeature {
  name: string;
  total_items: number;
  implemented_items: string[];
  related_files: string[];
  prd_summary: string;
}

export interface ReverseIAResult {
  features_count: number;
  features: ReverseFeature[];
  token_usage: { input: number; output: number };
  warnings: string[];
}

/**
 * 세션 로그에서 기능을 역추출하고 DB에 저장합니다.
 * 기획서 없이 합류한 유저를 위한 기능.
 */
export async function runReverseIA(projectId: string): Promise<ReverseIAResult> {
  const supabase = createAdminClient();
  const warnings: string[] = [];

  // 1. 세션 로그 조회
  const { data: sessions } = await supabase
    .from('sessions')
    .select('title, summary, prompts, changed_files')
    .eq('project_id', projectId)
    .order('number', { ascending: true });

  if (!sessions || sessions.length === 0) {
    return {
      features_count: 0,
      features: [],
      token_usage: { input: 0, output: 0 },
      warnings: ['No sessions found for reverse IA'],
    };
  }

  const sessionData = sessions.map((s) => ({
    title: s.title,
    summary: s.summary,
    prompts: Array.isArray(s.prompts) ? (s.prompts as string[]) : [],
    changed_files: Array.isArray(s.changed_files) ? (s.changed_files as string[]) : [],
  }));

  // 2. Claude API 호출
  const userMessage = buildReverseIAMessage({ sessions: sessionData });

  const result = await callClaude({
    systemPrompt: REVERSE_IA_SYSTEM,
    userMessage,
    tools: [REVERSE_IA_TOOL],
    maxTokens: 4096,
  });

  // 3. 응답 파싱
  const features: ReverseFeature[] = [];

  for (const input of result.toolInputs) {
    const rawFeatures = input.features;
    if (!Array.isArray(rawFeatures)) continue;

    for (const raw of rawFeatures) {
      const f = raw as Record<string, unknown>;
      if (typeof f.name === 'string' && typeof f.prd_summary === 'string') {
        features.push({
          name: f.name,
          total_items: typeof f.total_items === 'number' ? f.total_items : 1,
          implemented_items: Array.isArray(f.implemented_items) ? (f.implemented_items as string[]) : [],
          related_files: Array.isArray(f.related_files) ? (f.related_files as string[]) : [],
          prd_summary: f.prd_summary,
        });
      }
    }
  }

  // 4. spec_features 일괄 INSERT (document_id=null, source="PRD")
  if (features.length > 0) {
    const rows = features.map((f) => ({
      project_id: projectId,
      name: f.name,
      source: 'PRD' as const,
      status: 'implemented' as const,
      total_items: f.total_items,
      implemented_items: f.implemented_items as Database['public']['Tables']['spec_features']['Insert']['implemented_items'],
      related_files: f.related_files as Database['public']['Tables']['spec_features']['Insert']['related_files'],
      prd_summary: f.prd_summary,
    }));

    const { error } = await supabase.from('spec_features').insert(rows);

    if (error) {
      warnings.push(`Features extracted but failed to save: ${error.message}`);
    }
  }

  return {
    features_count: features.length,
    features,
    token_usage: result.tokenUsage,
    warnings,
  };
}
