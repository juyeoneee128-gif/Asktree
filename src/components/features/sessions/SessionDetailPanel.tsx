'use client';

import { useState } from 'react';
import { Calendar, Copy, FileEdit, FilePlus, MessageSquare, Wrench } from 'lucide-react';
import type { Session, SessionLogEntry } from '@/src/lib/mock-data';

export interface SessionDetailPanelProps {
  session: Session | null;
  rawLog?: string;
}

type Tab = 'summary' | 'log';

export function SessionDetailPanel({ session, rawLog }: SessionDetailPanelProps) {
  const [tab, setTab] = useState<Tab>('summary');

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-[14px] text-muted-foreground">
            왼쪽에서 세션을 선택하면 상세 내용이 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-6 gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1
          className="text-foreground"
          style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.45px', lineHeight: 1.4 }}
        >
          {session.title}
        </h1>
        <p className="text-[12px] text-muted-foreground">
          세션 #{session.number} · {session.date}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-6 border-b border-border">
        <TabButton active={tab === 'summary'} onClick={() => setTab('summary')}>
          요약
        </TabButton>
        <TabButton active={tab === 'log'} onClick={() => setTab('log')}>
          세션 로그
        </TabButton>
      </div>

      {tab === 'summary' ? (
        <SummaryView session={session} />
      ) : (
        <LogView session={session} rawLog={rawLog} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative pb-2.5 text-[14px] cursor-pointer transition-colors',
        active ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {children}
      {active && (
        <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-primary" />
      )}
    </button>
  );
}

// ─── Summary View ───

function SummaryView({ session }: { session: Session }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Stat row */}
      <div className="flex gap-2">
        <StatCard
          icon={<MessageSquare size={14} className="text-muted-foreground" />}
          label="프롬프트"
          value={`${session.prompts.length}개`}
        />
        <StatCard
          icon={<FileEdit size={14} className="text-muted-foreground" />}
          label="파일 변경"
          value={`${session.filesChanged}개`}
        />
        <StatCard
          icon={<Wrench size={14} className="text-muted-foreground" />}
          label="도구 사용"
          value={`${session.toolUseCount}회`}
        />
      </div>

      {/* Summary paragraph */}
      <div className="bg-card rounded-xl shadow-card p-5">
        <p
          className="text-foreground"
          style={{ fontSize: 14, lineHeight: 1.6, letterSpacing: '-0.15px' }}
        >
          {session.summary}
        </p>
      </div>

      {/* Changed files */}
      <div className="bg-card rounded-xl shadow-card p-5 flex flex-col gap-3">
        <p className="text-[12px] font-medium text-muted-foreground">변경 파일</p>
        {session.changedFiles.length === 0 ? (
          <p className="text-[13px] text-gray-400">변경된 파일이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {session.changedFiles.map((file) => (
              <div key={file.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {file.type === 'new' ? (
                    <FilePlus size={14} className="text-primary shrink-0" />
                  ) : (
                    <FileEdit size={14} className="text-gray-400 shrink-0" />
                  )}
                  <span
                    className="text-[14px] text-foreground truncate"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {file.name}
                  </span>
                </div>
                {file.type === 'new' ? (
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-semibold text-primary shrink-0"
                    style={{ backgroundColor: '#E67D221A' }}
                  >
                    신규
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-semibold text-gray-500 shrink-0">
                    수정
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompts */}
      <div className="rounded-xl p-5 flex flex-col gap-2" style={{ backgroundColor: '#FFF7ED' }}>
        <p className="text-[12px] font-medium text-muted-foreground">내 프롬프트</p>
        <div className="flex flex-col gap-2">
          {session.prompts.map((prompt, i) => (
            <p
              key={i}
              className="text-[14px] text-foreground"
              style={{ lineHeight: 1.43, letterSpacing: '-0.15px' }}
            >
              {prompt}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex-1 bg-card rounded-xl shadow-card px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[12px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-[18px] font-semibold text-foreground">{value}</p>
    </div>
  );
}

// ─── Log View ───

function LogView({ session, rawLog }: { session: Session; rawLog?: string }) {
  const useRaw = !!rawLog && session.log.length === 0;

  const handleCopyAll = () => {
    const text = useRaw
      ? rawLog ?? ''
      : session.log.map(formatEntryAsText).join('\n\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="rounded-xl p-6 flex flex-col gap-3 relative"
        style={{ backgroundColor: '#0C0A09' }}
      >
        {/* macOS dots */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF5F57' }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FEBC2E' }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28C840' }} />
        </div>

        {useRaw ? (
          <pre
            className="text-white text-[12px] whitespace-pre-wrap break-all max-h-[600px] overflow-y-auto"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {rawLog}
          </pre>
        ) : (
          <div className="flex flex-col gap-3" style={{ fontFamily: 'var(--font-mono)' }}>
            {session.log.map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))}
          </div>
        )}

        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/30 text-white text-[12px] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Copy size={12} />
            전체 복사
          </button>
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground">
        CLI 로그 원문 · 복사하여 학습/공유에 활용하세요
      </p>
    </div>
  );
}

function LogEntry({ entry }: { entry: SessionLogEntry }) {
  if (entry.type === 'user') {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-primary">User:</span>
        <span className="text-[13px]" style={{ color: '#D6D3D1', lineHeight: 1.6 }}>
          {entry.content}
        </span>
      </div>
    );
  }

  if (entry.type === 'assistant') {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold" style={{ color: '#3B82F6' }}>
          Assistant:
        </span>
        <span className="text-[13px]" style={{ color: '#D6D3D1', lineHeight: 1.6 }}>
          {entry.content}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] font-semibold" style={{ color: '#A8A29E' }}>
        [Tool: {entry.action}]
      </span>
      {entry.file && (
        <span className="text-[13px]" style={{ color: '#D6D3D1' }}>
          {entry.file}
        </span>
      )}
      {entry.lines?.map((line, i) => (
        <span
          key={i}
          className="text-[13px]"
          style={{ color: lineColor(line.kind), lineHeight: 1.5 }}
        >
          {line.text}
        </span>
      ))}
    </div>
  );
}

function lineColor(kind: 'add' | 'remove' | 'info'): string {
  if (kind === 'add') return '#16A34A';
  if (kind === 'remove') return '#DC2626';
  return '#A8A29E';
}

function formatEntryAsText(entry: SessionLogEntry): string {
  if (entry.type === 'user') return `User:\n${entry.content}`;
  if (entry.type === 'assistant') return `Assistant:\n${entry.content}`;
  const head = `[Tool: ${entry.action}]`;
  const file = entry.file ? `\n${entry.file}` : '';
  const lines = entry.lines?.map((l) => l.text).join('\n') ?? '';
  return [head, file, lines].filter(Boolean).join(file ? '' : '\n');
}
