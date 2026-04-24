'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Coins, Key } from 'lucide-react';
import { SettingsCardGrid } from '@/src/components/composite/SettingsCardGrid';
import { PageSkeleton } from '@/src/components/ui/Skeleton';
import { fetchProfile, type UserProfile } from '@/src/lib/api/user';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((e) =>
        setError(e instanceof Error ? e.message : '프로필을 불러올 수 없습니다')
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[14px] text-destructive">
          {error ?? '프로필을 불러올 수 없습니다'}
        </p>
      </div>
    );
  }

  const initial = (profile.name || profile.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1120px] mx-auto px-8 py-10 flex flex-col gap-6">
        <h1 className="text-[22px] font-bold text-foreground">내 설정</h1>

        <SettingsCardGrid
          cards={[
            {
              icon: <User size={20} className="text-primary" />,
              title: '계정 정보',
              content: (
                <div className="flex items-center gap-3">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.name || profile.email}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted text-foreground text-[14px] font-semibold flex items-center justify-center shrink-0">
                      {initial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-foreground truncate">
                      {profile.name || profile.email.split('@')[0]}
                    </div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {profile.email}
                    </div>
                  </div>
                </div>
              ),
              linkLabel: '상세 보기 →',
              onLinkClick: () => router.push('/settings/account'),
            },
            {
              icon: <Coins size={20} className="text-primary" />,
              title: '크레딧',
              content: (
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[24px] font-bold text-foreground">
                      {profile.credits.toLocaleString()}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      / {profile.total_credits.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[12px] text-muted-foreground">
                    이번 달 {profile.used_this_month.toLocaleString()} 사용
                  </span>
                </div>
              ),
              linkLabel: '상세 보기 →',
              onLinkClick: () => router.push('/settings/credits'),
            },
            {
              icon: <Key size={20} className="text-primary" />,
              title: 'API 키',
              content: (
                <div className="flex flex-col gap-1">
                  {profile.has_api_key ? (
                    <>
                      <span className="text-[14px] font-semibold text-foreground">
                        등록됨
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        Anthropic API 키가 저장되어 있습니다.
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[14px] font-semibold" style={{ color: '#F97316' }}>
                        미등록 (대기)
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        맛보기 크레딧 소진 전에 등록하세요.
                      </span>
                    </>
                  )}
                </div>
              ),
              linkLabel: '상세 보기 →',
              onLinkClick: () => router.push('/settings/api-key'),
            },
          ]}
        />
      </div>
    </div>
  );
}
