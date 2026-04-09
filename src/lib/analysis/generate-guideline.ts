import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import { callClaude } from './claude-client';
import {
  GUIDELINE_RESULT_TOOL,
  GUIDELINE_GENERATION_SYSTEM,
  buildGuidelineMessage,
} from './prompts';
import { parseGuidelineResponse } from './parse-response';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface GenerateGuidelineResult {
  guideline_id: string | null;
  title: string | null;
  rule: string | null;
  tokenUsage: { input: number; output: number };
  error: string | null;
}

/**
 * 이슈를 기반으로 CLAUDE.md 보호 규칙을 생성합니다.
 * 이슈 "확인 완료" 시 호출됩니다.
 */
export async function generateGuidelineFromIssue(
  issueId: string
): Promise<GenerateGuidelineResult> {
  const supabase = createAdminClient();

  // 이슈 조회
  const { data: issue, error: fetchError } = await supabase
    .from('issues')
    .select('project_id, title, fact, detail, file, basis')
    .eq('id', issueId)
    .single();

  if (fetchError || !issue) {
    return {
      guideline_id: null,
      title: null,
      rule: null,
      tokenUsage: { input: 0, output: 0 },
      error: `Issue not found: ${issueId}`,
    };
  }

  // Claude API 호출
  const userMessage = buildGuidelineMessage({
    issueTitle: issue.title,
    issueFact: issue.fact,
    issueDetail: issue.detail,
    issueFile: issue.file,
    issueBasis: issue.basis,
  });

  const result = await callClaude({
    systemPrompt: GUIDELINE_GENERATION_SYSTEM,
    userMessage,
    tools: [GUIDELINE_RESULT_TOOL],
    maxTokens: 1024,
  });

  const guideline = parseGuidelineResponse(result);

  if (!guideline) {
    return {
      guideline_id: null,
      title: null,
      rule: null,
      tokenUsage: result.tokenUsage,
      error: 'Failed to parse guideline from Claude response',
    };
  }

  // guidelines 테이블 INSERT
  const { data: saved, error: insertError } = await supabase
    .from('guidelines')
    .insert({
      project_id: issue.project_id,
      source_issue_id: issueId,
      title: guideline.title,
      rule: guideline.rule,
      status: 'unapplied',
    })
    .select('id')
    .single();

  if (insertError) {
    return {
      guideline_id: null,
      title: guideline.title,
      rule: guideline.rule,
      tokenUsage: result.tokenUsage,
      error: `Failed to save guideline: ${insertError.message}`,
    };
  }

  return {
    guideline_id: saved.id,
    title: guideline.title,
    rule: guideline.rule,
    tokenUsage: result.tokenUsage,
    error: null,
  };
}
