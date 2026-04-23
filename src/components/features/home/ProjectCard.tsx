'use client';

import { useState, type MouseEvent } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { StatusDot } from '@/src/components/ui/StatusDot';
import { Badge } from '@/src/components/ui/Badge';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { Dropdown } from '@/src/components/ui/Dropdown';
import type { Project } from '@/src/lib/mock-data';

export interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, onClick, onEdit, onDelete }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = (e: MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  const { critical, warning, info } = project.issueCount;
  const totalIssues = critical + warning + info;

  return (
    <Card
      padding="20px"
      className="cursor-pointer relative"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-semibold text-foreground truncate">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusDot status={project.agentStatus} />
            <span className="text-[12px] text-muted-foreground">
              {project.agentStatus === 'connected' ? '연결됨' : '미연결'}
            </span>
            {project.lastAnalysis && (
              <>
                <span className="text-[12px] text-gray-300">·</span>
                <span className="text-[12px] text-muted-foreground">
                  {project.lastAnalysis} 분석
                </span>
              </>
            )}
          </div>
        </div>

        {/* Menu button — 이 영역 내부 클릭은 카드 전체 onClick으로 버블링 금지 */}
        <div
          className="relative shrink-0 -mt-1 -mr-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleMenuClick}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="프로젝트 메뉴"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1">
              <Dropdown
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                items={[
                  {
                    icon: <Pencil size={14} />,
                    label: '이름 수정',
                    onClick: () => onEdit?.(),
                  },
                  {
                    icon: <Trash2 size={14} />,
                    label: '프로젝트 삭제',
                    variant: 'danger',
                    onClick: () => onDelete?.(),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Issues */}
      <div className="flex items-center gap-1.5 mb-4 min-h-[24px]">
        {totalIssues === 0 ? (
          <span className="text-[12px] text-muted-foreground">감지된 이슈 없음</span>
        ) : (
          <>
            {critical > 0 && <Badge variant="critical">Critical {critical}</Badge>}
            {warning > 0 && <Badge variant="warning">Warning {warning}</Badge>}
            {info > 0 && <Badge variant="info">Info {info}</Badge>}
          </>
        )}
      </div>

      {/* Implementation rate */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] text-muted-foreground">구현률</span>
          <span className="text-[12px] font-semibold text-foreground">
            {project.implementationRate}%
          </span>
        </div>
        <ProgressBar value={project.implementationRate} />
      </div>
    </Card>
  );
}
