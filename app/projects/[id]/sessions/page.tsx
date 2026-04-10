'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import { GlobalHeader } from '@/src/components/layout/GlobalHeader';
import { MasterDetailLayout } from '@/src/components/layout/MasterDetailLayout';
import { EmptyState } from '@/src/components/composite/EmptyState';
import { SessionDetailPanel } from '@/src/components/features/sessions/SessionDetailPanel';
import { mockSessions, type Session } from '@/src/lib/mock-data';

export default function SessionsPage() {
  const sessions = mockSessions;
  const [selectedId, setSelectedId] = useState<string | null>(
    sessions[0]?.id ?? null,
  );

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedId) ?? null,
    [sessions, selectedId],
  );

  const isEmpty = sessions.length === 0;

  return (
    <>
      <GlobalHeader
        leftContent={
          <span className="text-[14px] font-semibold text-foreground">
            전체 세션 {sessions.length}개
          </span>
        }
        rightContent={
          sessions.length > 0 ? (
            <span className="text-[13px] text-muted-foreground">
              마지막 세션 {sessions[0].date}
            </span>
          ) : null
        }
      />

      {isEmpty ? (
        <div className="flex-1 bg-background flex items-center justify-center">
          <EmptyState
            icon={<Calendar size={48} className="text-gray-300" />}
            title="아직 기록된 세션이 없습니다."
            description="에이전트가 연결되면 코딩 세션이 자동으로 기록됩니다."
            primaryAction={{
              label: '에이전트 연결하기',
              onClick: () => {},
            }}
          />
        </div>
      ) : (
        <MasterDetailLayout
          listContent={
            <SessionList
              sessions={sessions}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          }
          detailContent={<SessionDetailPanel session={selectedSession} />}
        />
      )}
    </>
  );
}

// ─── List ───

function SessionList({
  sessions,
  selectedId,
  onSelect,
}: {
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {sessions.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          isSelected={selectedId === session.id}
          onClick={() => onSelect(session.id)}
        />
      ))}
    </div>
  );
}

function SessionRow({
  session,
  isSelected,
  onClick,
}: {
  session: Session;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-5 py-4 border-b border-border transition-colors cursor-pointer relative',
        isSelected ? 'bg-background' : 'bg-transparent hover:bg-gray-50',
      ].join(' ')}
    >
      {isSelected && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[14px] font-semibold text-foreground truncate"
            style={{ letterSpacing: '-0.15px', lineHeight: 1.43 }}
          >
            {session.title}
          </span>
          {session.hasIssue && (
            <AlertTriangle size={14} className="text-warning-orange shrink-0" />
          )}
        </div>
        <span className="text-[12px] text-muted-foreground" style={{ lineHeight: 1.33 }}>
          세션 #{session.number} · {session.date}
          {session.filesChanged > 0 && ` · 파일 ${session.filesChanged}개 변경`}
        </span>
      </div>
    </button>
  );
}
