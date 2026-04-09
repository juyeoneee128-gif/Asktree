import Anthropic from '@anthropic-ai/sdk';
import type { Tool, Message } from '@anthropic-ai/sdk/resources/messages';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return client;
}

export interface ClaudeCallOptions {
  systemPrompt: string;
  userMessage: string;
  tools: Tool[];
  maxTokens?: number;
}

export interface ClaudeCallResult {
  toolInputs: Record<string, unknown>[];
  tokenUsage: {
    input: number;
    output: number;
  };
  rawResponse: Message;
}

/**
 * Claude API를 호출하고 tool_use 응답을 파싱합니다.
 * temperature=0으로 결정적 분석 결과를 보장합니다.
 */
export async function callClaude(options: ClaudeCallOptions): Promise<ClaudeCallResult> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: options.maxTokens ?? MAX_TOKENS,
    temperature: 0,
    system: options.systemPrompt,
    messages: [
      { role: 'user', content: options.userMessage },
    ],
    tools: options.tools,
    tool_choice: { type: 'any' },
  });

  // tool_use 블록 추출
  const toolInputs: Record<string, unknown>[] = [];
  for (const block of response.content) {
    if (block.type === 'tool_use') {
      toolInputs.push(block.input as Record<string, unknown>);
    }
  }

  return {
    toolInputs,
    tokenUsage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
    rawResponse: response,
  };
}

/**
 * 토큰 수를 대략적으로 추정합니다. (1 토큰 ≈ 4 chars)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export { MODEL, MAX_TOKENS };
