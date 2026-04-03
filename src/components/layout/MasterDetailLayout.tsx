import type { ReactNode } from 'react';

export interface MasterDetailLayoutProps {
  listContent: ReactNode;
  detailContent: ReactNode;
  /** 좌측 리스트 너비 (기본 35%) */
  listWidth?: string;
}

export function MasterDetailLayout({
  listContent,
  detailContent,
  listWidth = '35%',
}: MasterDetailLayoutProps) {
  return (
    <div className="flex flex-1 min-h-0">
      {/* Master (좌측 리스트) */}
      <div
        className="overflow-y-auto bg-muted"
        style={{ width: listWidth, flexShrink: 0 }}
      >
        {listContent}
      </div>

      {/* Divider */}
      <div className="w-px bg-border shrink-0" />

      {/* Detail (우측 패널) */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {detailContent}
      </div>
    </div>
  );
}
