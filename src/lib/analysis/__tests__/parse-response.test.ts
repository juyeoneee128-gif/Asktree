import { describe, it, expect } from 'vitest';
import { parseAnalysisResponse, parseGuidelineResponse } from '../parse-response';
import type { ClaudeCallResult } from '../claude-client';
import type { Message } from '@anthropic-ai/sdk/resources/messages';

// ─── Mock 헬퍼 ───

function mockResult(toolInputs: Record<string, unknown>[]): ClaudeCallResult {
  return {
    toolInputs,
    tokenUsage: { input: 500, output: 200 },
    rawResponse: {} as Message,
  };
}

describe('parseAnalysisResponse', () => {
  it('정상적인 이슈 배열을 파싱한다', () => {
    const result = parseAnalysisResponse(
      mockResult([
        {
          issues: [
            {
              title: 'API 키 하드코딩 감지',
              level: 'critical',
              fact: 'src/config.ts에 API 키가 하드코딩되어 있습니다.',
              detail: '코드가 push되면 키가 노출됩니다.',
              fix_command: 'src/config.ts의 API 키를 환경변수로 바꿔줘.',
              file: 'src/config.ts',
              basis: 'OWASP A02:2021',
            },
            {
              title: '에러 처리 누락',
              level: 'warning',
              fact: 'async 함수에 try-catch가 없습니다.',
              detail: '에러 발생 시 서버가 크래시할 수 있습니다.',
              fix_command: 'src/api/handler.ts의 async 함수에 에러 처리를 추가해줘.',
              file: 'src/api/handler.ts',
              basis: 'Error Handling Best Practices',
            },
          ],
        },
      ])
    );

    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].title).toBe('API 키 하드코딩 감지');
    expect(result.issues[0].level).toBe('critical');
    expect(result.issues[1].level).toBe('warning');
    expect(result.warnings).toHaveLength(0);
    expect(result.tokenUsage.input).toBe(500);
  });

  it('빈 이슈 배열을 반환한다', () => {
    const result = parseAnalysisResponse(mockResult([{ issues: [] }]));

    expect(result.issues).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('도구 미호출 시 경고를 반환한다', () => {
    const result = parseAnalysisResponse(mockResult([]));

    expect(result.issues).toHaveLength(0);
    expect(result.warnings).toContain('Claude did not call the analysis tool');
  });

  it('필수 필드 누락 이슈는 스킵하고 경고를 남긴다', () => {
    const result = parseAnalysisResponse(
      mockResult([
        {
          issues: [
            {
              title: '정상 이슈',
              level: 'info',
              fact: 'fact',
              detail: 'detail',
              fix_command: 'fix',
              file: 'file.ts',
              basis: 'basis',
            },
            {
              title: '불완전 이슈',
              level: 'critical',
              // fact 누락
            },
          ],
        },
      ])
    );

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].title).toBe('정상 이슈');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Issue[1]');
  });

  it('잘못된 level 값은 거부한다', () => {
    const result = parseAnalysisResponse(
      mockResult([
        {
          issues: [
            {
              title: '이슈',
              level: 'danger', // 유효하지 않음
              fact: 'f',
              detail: 'd',
              fix_command: 'fix',
              file: 'f.ts',
              basis: 'b',
            },
          ],
        },
      ])
    );

    expect(result.issues).toHaveLength(0);
    expect(result.warnings[0]).toContain('invalid level');
  });

  it('issues가 배열이 아니면 경고를 남긴다', () => {
    const result = parseAnalysisResponse(
      mockResult([{ issues: 'not an array' }])
    );

    expect(result.issues).toHaveLength(0);
    expect(result.warnings).toContain('issues field is not an array');
  });
});

describe('parseGuidelineResponse', () => {
  it('정상적인 규칙을 파싱한다', () => {
    const result = parseGuidelineResponse(
      mockResult([
        {
          title: 'API 키 하드코딩 금지',
          rule: 'API 키를 소스 파일에 절대 하드코딩하지 마라.',
        },
      ])
    );

    expect(result).not.toBeNull();
    expect(result!.title).toBe('API 키 하드코딩 금지');
    expect(result!.rule).toContain('하드코딩');
  });

  it('도구 미호출 시 null을 반환한다', () => {
    expect(parseGuidelineResponse(mockResult([]))).toBeNull();
  });

  it('빈 문자열이면 null을 반환한다', () => {
    const result = parseGuidelineResponse(
      mockResult([{ title: '', rule: '' }])
    );
    expect(result).toBeNull();
  });
});
