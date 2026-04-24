'use client';

import { ChevronDown } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface SidebarMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export type AgentStatus = 'connected' | 'disconnected';

export interface SidebarProps {
  projectName: string;
  menuItems: SidebarMenuItem[];
  activeMenu: string;
  agentStatus: AgentStatus;
  onMenuClick: (key: string) => void;
  onProjectSelect: () => void;
}

export function Sidebar({
  projectName,
  menuItems,
  activeMenu,
  agentStatus,
  onMenuClick,
  onProjectSelect,
}: SidebarProps) {
  return (
    <aside className="flex flex-col h-full w-[220px] bg-background border-r border-border">
      {/* Project Selector */}
      <button
        type="button"
        onClick={onProjectSelect}
        className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors cursor-pointer"
      >
        <span className="text-[14px] font-semibold text-foreground truncate">
          {projectName}
        </span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Menu */}
      <nav className="flex-1 py-2">
        {menuItems.map((item) => {
          const isActive = item.key === activeMenu;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onMenuClick(item.key)}
              className={[
                'w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] transition-colors cursor-pointer',
                'relative',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-sm" />
              )}

              {/* Icon */}
              <span className="shrink-0 w-[18px] h-[18px] flex items-center justify-center">
                {item.icon}
              </span>

              {/* Label */}
              <span className="flex-1 text-left">{item.label}</span>

              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="sidebar">{item.badge}</Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border px-4 py-3">
        {/* Agent status */}
        <div className="flex items-center gap-2 text-[12px]">
          <span
            className={[
              'w-2 h-2 rounded-full shrink-0',
              agentStatus === 'connected' ? 'bg-success' : 'bg-destructive',
            ].join(' ')}
          />
          <span className="text-muted-foreground">
            {agentStatus === 'connected' ? '에이전트 연결됨' : '에이전트 미연결'}
          </span>
        </div>
      </div>
    </aside>
  );
}
