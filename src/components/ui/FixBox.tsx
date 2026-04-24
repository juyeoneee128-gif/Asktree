'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Toast } from './Toast';

export interface FixBoxProps {
  command: string;
  onCopy?: () => void;
}

export function FixBox({ command, onCopy }: FixBoxProps) {
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setToastVisible(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'rgba(230, 125, 34, 0.05)' }}
    >
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[13px] font-semibold text-primary">
          {'>_'} 복구 명령어 — Claude Code에 붙여넣으세요
        </span>
      </div>

      {/* Command */}
      <pre className="font-mono text-[13px] text-foreground whitespace-pre-wrap break-words leading-relaxed">
        {command}
      </pre>

      {/* Copy button */}
      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={handleCopy}
          className={[
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg border transition-colors cursor-pointer',
            copied
              ? 'border-success text-success bg-transparent'
              : 'border-border text-foreground hover:bg-muted',
          ].join(' ')}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '복사됨' : '복사'}
        </button>
      </div>

      <Toast
        message="복사되었습니다. 지금 바로 Claude Code에 붙여넣으세요!"
        duration={2000}
        isVisible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </div>
  );
}
