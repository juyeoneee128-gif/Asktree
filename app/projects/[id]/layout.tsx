'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  AlertCircle,
  Shield,
  Clock,
  FileText,
  Settings,
} from 'lucide-react';
import { Sidebar } from '@/src/components/layout/Sidebar';

const menuItems = [
  { key: 'status', label: '현황', icon: <BarChart2 size={18} /> },
  { key: 'issues', label: '이슈', icon: <AlertCircle size={18} />, badge: 4 },
  { key: 'claude-md', label: 'CLAUDE.md', icon: <Shield size={18} />, badge: 2 },
  { key: 'sessions', label: '세션', icon: <Clock size={18} /> },
  { key: 'specs', label: '기획서', icon: <FileText size={18} /> },
  { key: 'settings', label: '설정', icon: <Settings size={18} /> },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = params.id as string;

  // 현재 활성 메뉴 추출: /projects/[id]/issues → "issues"
  const segments = pathname.split('/');
  const activeMenu = segments[3] || 'status';

  return (
    <div className="flex h-full">
      <Sidebar
        projectName="Asktree"
        menuItems={menuItems}
        activeMenu={activeMenu}
        agentStatus="connected"
        credits={36}
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
