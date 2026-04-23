'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  AlertCircle,
  Shield,
  Clock,
  FileText,
  Settings,
} from 'lucide-react';
import { Sidebar, type AgentStatus, type SidebarMenuItem } from '@/src/components/layout/Sidebar';

export interface ProjectShellProps {
  projectId: string;
  projectName: string;
  agentStatus: AgentStatus;
  credits: number;
  issueBadge: number;
  guidelineBadge: number;
  children: React.ReactNode;
}

export function ProjectShell({
  projectId,
  projectName,
  agentStatus,
  credits,
  issueBadge,
  guidelineBadge,
  children,
}: ProjectShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // 현재 활성 메뉴 추출: /projects/[id]/issues → "issues"
  const segments = pathname.split('/');
  const activeMenu = segments[3] || 'status';

  const menuItems = useMemo<SidebarMenuItem[]>(
    () => [
      { key: 'status', label: '현황', icon: <BarChart2 size={18} /> },
      { key: 'issues', label: '이슈', icon: <AlertCircle size={18} />, badge: issueBadge },
      { key: 'claude-md', label: 'CLAUDE.md', icon: <Shield size={18} />, badge: guidelineBadge },
      { key: 'sessions', label: '세션', icon: <Clock size={18} /> },
      { key: 'specs', label: '기획서', icon: <FileText size={18} /> },
      { key: 'settings', label: '설정', icon: <Settings size={18} /> },
    ],
    [issueBadge, guidelineBadge]
  );

  return (
    <div className="flex h-full">
      <Sidebar
        projectName={projectName}
        menuItems={menuItems}
        activeMenu={activeMenu}
        agentStatus={agentStatus}
        credits={credits}
        onMenuClick={(key) => router.push(`/projects/${projectId}/${key}`)}
        onProjectSelect={() => router.push('/projects')}
        onCreditClick={() => router.push('/admin/credits')}
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
