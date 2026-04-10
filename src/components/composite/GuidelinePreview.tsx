'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export interface GuidelinePreviewProps {
  /** 미리보기에 표시할 보호 규칙 텍스트 */
  rule: string;
  /** 코드 블록 아래 안내 문구. 기본값 제공. */
  hint?: string;
  onCopy?: () => void;
}

const DEFAULT_HINT = '이 텍스트를 CLAUDE.md 파일에 붙여넣으세요.';

/**
 * CLAUDE.md 보호 규칙 미리보기.
 * Pencil 디자인 (Node ID: wFzcH) 기준으로 다크 코드 블록 + 안내 텍스트 조합.
 *
 * - 코드 블록 배경: #1C1917 (--color-foreground)
 * - 코드 블록 텍스트: #E7E5E4 (--color-border)
 * - 복사 버튼: #44403C 채움, 흰색 텍스트
 * - 안내 텍스트: #A8A29E
 */
export function GuidelinePreview({ rule, hint = DEFAULT_HINT, onCopy }: GuidelinePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rule);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Dark code block */}
      <div
        className="rounded-lg flex items-start gap-3"
        style={{ backgroundColor: '#1C1917', padding: 16 }}
      >
        <pre
          className="font-mono whitespace-pre-wrap break-words flex-1 m-0"
          style={{
            color: '#E7E5E4',
            fontSize: 13,
            lineHeight: 1.6,
            letterSpacing: '-0.2px',
          }}
        >
          {rule}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 inline-flex items-center gap-1 rounded transition-colors cursor-pointer"
          style={{
            backgroundColor: '#44403C',
            color: '#FFFFFF',
            fontSize: 12,
            padding: '4px 8px',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '복사됨' : '복사'}
        </button>
      </div>

      {/* Hint */}
      <p
        className="mt-3"
        style={{ color: '#A8A29E', fontSize: 12 }}
      >
        {hint}
      </p>
    </div>
  );
}
