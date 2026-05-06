import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import { callClaude } from '../analysis/claude-client';
import { ANALYSIS_MODELS } from '../analysis/models';
import {
  EXTRACT_FEATURES_TOOL,
  EXTRACT_FEATURES_SYSTEM,
  buildExtractFeaturesMessage,
} from './prompts';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface ExtractedFeature {
  name: string;
  total_items: number;
  prd_summary: string;
}

export interface ExtractFeaturesResult {
  document_id: string;
  features_count: number;
  features: ExtractedFeature[];
  token_usage: { input: number; output: number };
  error: string | null;
}

/**
 * spec_documents에 새 row를 INSERT하고 id를 반환합니다.
 * 수동 업로드 흐름에서 사용. agent 흐름은 syncAgentDocs에서 직접 upsert.
 */
async function insertSpecDocument(
  projectId: string,
  documentName: string,
  documentType: 'FRD' | 'PRD'
): Promise<{ id: string } | { error: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('spec_documents')
    .insert({
      project_id: projectId,
      name: documentName,
      type: documentType,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { error: `Failed to save document: ${error?.message}` };
  }
  return { id: data.id };
}

/**
 * 주어진 document_id에 대해 Claude로 기능 추출 → spec_features INSERT.
 * 호출 측은 spec_documents row가 이미 존재한다는 것을 보장해야 함.
 *
 * agent 흐름(syncAgentDocs)과 수동 업로드 흐름(extractAndSaveFeatures)이 공통으로 사용.
 */
export async function extractFeaturesForDocument(
  projectId: string,
  documentId: string,
  documentType: 'FRD' | 'PRD',
  content: string
): Promise<ExtractFeaturesResult> {
  const supabase = createAdminClient();

  // 1. Claude API 호출
  const userMessage = buildExtractFeaturesMessage(content, documentType);

  const result = await callClaude({
    systemPrompt: EXTRACT_FEATURES_SYSTEM,
    userMessage,
    tools: [EXTRACT_FEATURES_TOOL],
    maxTokens: 4096,
    model: ANALYSIS_MODELS.EXTRACT_FEATURES,
  });

  // 2. 응답 파싱
  const features: ExtractedFeature[] = [];

  for (const input of result.toolInputs) {
    const rawFeatures = input.features;
    if (!Array.isArray(rawFeatures)) continue;

    for (const raw of rawFeatures) {
      const f = raw as Record<string, unknown>;
      if (typeof f.name === 'string' && typeof f.prd_summary === 'string') {
        features.push({
          name: f.name,
          total_items: typeof f.total_items === 'number' ? f.total_items : 1,
          prd_summary: f.prd_summary,
        });
      }
    }
  }

  // 3. spec_features 일괄 INSERT
  if (features.length > 0) {
    const rows = features.map((f) => ({
      project_id: projectId,
      document_id: documentId,
      name: f.name,
      source: documentType,
      status: 'unimplemented' as const,
      total_items: f.total_items,
      prd_summary: f.prd_summary,
    }));

    const { error: insertError } = await supabase.from('spec_features').insert(rows);

    if (insertError) {
      return {
        document_id: documentId,
        features_count: 0,
        features,
        token_usage: result.tokenUsage,
        error: `Features extracted but failed to save: ${insertError.message}`,
      };
    }
  }

  return {
    document_id: documentId,
    features_count: features.length,
    features,
    token_usage: result.tokenUsage,
    error: null,
  };
}

/**
 * 기획서 텍스트에서 기능 목록을 추출하고 DB에 저장합니다.
 *
 * 수동 업로드 흐름 — 항상 새 spec_documents row를 INSERT.
 * agent 흐름은 syncAgentDocs + extractFeaturesForDocument 조합 사용.
 */
export async function extractAndSaveFeatures(
  projectId: string,
  documentName: string,
  documentType: 'FRD' | 'PRD',
  content: string
): Promise<ExtractFeaturesResult> {
  const insertResult = await insertSpecDocument(projectId, documentName, documentType);
  if ('error' in insertResult) {
    return {
      document_id: '',
      features_count: 0,
      features: [],
      token_usage: { input: 0, output: 0 },
      error: insertResult.error,
    };
  }

  return extractFeaturesForDocument(
    projectId,
    insertResult.id,
    documentType,
    content
  );
}
