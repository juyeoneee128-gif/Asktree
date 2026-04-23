'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Folder,
  Star,
  Trash2,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react';

const topMenuItems = [
  { key: '/projects', label: '모든 프로젝트', icon: Folder },
  { key: '/favorites', label: '즐겨찾기', icon: Star },
  { key: '/trash', label: '휴지통', icon: Trash2 },
];

const bottomMenuItems = [
  { key: '/admin', label: '관리자 설정', icon: Settings },
  { key: '/admin/credits', label: '플랜 및 결제', icon: CreditCard },
];

export interface HomeSidebarUser {
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface HomeSidebarProps {
  user: HomeSidebarUser;
}

export function HomeSidebar({ user }: HomeSidebarProps) {
  const pathname = usePathname();
  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();

  return (
    <aside className="flex flex-col h-full w-[220px] bg-background border-r border-border shrink-0">
      {/* Logo */}
      <div className="px-4 py-4">
        <span className="text-[18px] font-bold text-foreground">Asktree</span>
      </div>

      <div className="h-px bg-border" />

      {/* Top menu */}
      <nav className="flex-1 py-2">
        {topMenuItems.map((item) => {
          const isActive = pathname === item.key || pathname.startsWith(item.key + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.key}
              className={[
                'w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] transition-colors relative',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-sm" />
              )}
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom menu */}
      <div className="border-t border-border py-2">
        {bottomMenuItems.map((item) => {
          const isActive = pathname === item.key || (item.key === '/admin' && pathname.startsWith('/admin'));
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.key}
              className={[
                'w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] transition-colors relative',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-sm" />
              )}
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User block */}
      <div className="border-t border-border px-4 py-3 flex items-center gap-2.5">
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.name || user.email}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted text-foreground text-[13px] font-semibold flex items-center justify-center shrink-0">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-foreground truncate">
            {user.name || user.email.split('@')[0]}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {user.email}
          </div>
        </div>
        <form action="/auth/logout" method="POST">
          <button
            type="submit"
            aria-label="로그아웃"
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
}
