import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import { estimateTokens } from './claude-client';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface CreditEstimate {
  estimated_credits: number;
  estimated_tokens: {
    input: number;
    output: number;
  };
  diff_count: number;
  diff_size_bytes: number;
  has_previous_session: boolean;
  analysis_types: string[];
}

const SYSTEM_PROMPT_TOKENS = 800;
const ESTIMATED_OUTPUT_TOKENS = 1000;
const SESSION_COMPARISON_EXTRA_TOKENS = 1500;

/**
 * 분석 실행 전 예상 크레딧/토큰을 계산합니다.
 */
export async function estimateAnalysisCredits(
  projectId: string,
  sessionId: string
): Promise<CreditEstimate> {
  const supabase = createAdminClient();

  // ephemeral diff 조회
  const { data: ephemeralRows } = await supabase
    .from('ephemeral_data')
    .select('content, data_type')
    .eq('session_id', sessionId);

  let diffCount = 0;
  let diffSizeBytes = 0;
  let diffTokens = 0;

  for (const row of ephemeralRows ?? []) {
    if (row.data_type === 'diff') {
      diffCount++;
      const content = row.content as Record<string, unknown>;
      const diffText = (content.diff_content as string) ?? '';
      diffSizeBytes += new TextEncoder().encode(diffText).length;
      diffTokens += estimateTokens(diffText);
    }
  }

  // 이전 세션 존재 여부
  const { data: session } = await supabase
    .from('sessions')
    .select('number')
    .eq('id', sessionId)
    .single();

  let hasPreviousSession = false;
  if (session && session.number > 1) {
    const { data: prev } = await supabase
      .from('sessions')
      .select('id')
      .eq('project_id', projectId)
      .eq('number', session.number - 1)
      .single();

    hasPreviousSession = !!prev;
  }

  // 분석 유형
  const analysisTypes: string[] = [];
  if (diffCount > 0) analysisTypes.push('static');
  if (diffCount > 0 && hasPreviousSession) analysisTypes.push('session_comparison');

  // 토큰 추정
  let estimatedInput = SYSTEM_PROMPT_TOKENS + diffTokens;
  if (hasPreviousSession) estimatedInput += SESSION_COMPARISON_EXTRA_TOKENS;

  const estimatedOutput = ESTIMATED_OUTPUT_TOKENS * analysisTypes.length;

  return {
    estimated_credits: analysisTypes.length > 0 ? 1 : 0,
    estimated_tokens: {
      input: estimatedInput,
      output: estimatedOutput,
    },
    diff_count: diffCount,
    diff_size_bytes: diffSizeBytes,
    has_previous_session: hasPreviousSession,
    analysis_types: analysisTypes,
  };
}
