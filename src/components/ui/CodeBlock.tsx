'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export interface CodeBlockProps {
  code: string;
  showCopyButton?: boolean;
  onCopy?: () => void;
}

export function CodeBlock({ code, showCopyButton = true, onCopy }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gray-800 rounded-lg p-4">
      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 text-[12px] text-gray-200 rounded border border-gray-200/20 hover:bg-gray-200/10 transition-colors cursor-pointer"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '복사됨' : '복사'}
        </button>
      )}
      <pre className="font-mono text-[13px] text-gray-200 whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}
