'use client';

import { useEffect, useState } from 'react';
import { Coins, CreditCard } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { MetricCard } from '@/src/components/ui/MetricCard';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { PageSkeleton } from '@/src/components/ui/Skeleton';
import { fetchCredits, type CreditsInfo } from '@/src/lib/api/user';

export default function CreditsPage() {
  const [info, setInfo] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits()
      .then(setInfo)
      .catch((e) =>
        setError(e instanceof Error ? e.message : '크레딧 정보를 불러올 수 없습니다')
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !info) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[14px] text-destructive">
          {error ?? '크레딧 정보를 불러올 수 없습니다'}
        </p>
      </div>
    );
  }

  const usageRate =
    info.total > 0 ? Math.round((info.used_this_month / info.total) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[840px] mx-auto px-8 py-10 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Coins size={22} className="text-primary" />
          <h1 className="text-[22px] font-bold text-foreground">크레딧</h1>
        </div>

        <Card padding="24px" className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-6">
            <MetricCard
              label="잔여"
              value={info.remaining.toLocaleString()}
              valueColor="var(--color-primary)"
            />
            <MetricCard label="총 크레딧" value={info.total.toLocaleString()} />
            <MetricCard
              label="이번 달 사용"
              value={info.used_this_month.toLocaleString()}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-muted-foreground">이번 달 사용률</span>
              <span className="text-[12px] font-semibold text-foreground">
                {usageRate}%
              </span>
            </div>
            <ProgressBar value={usageRate} />
          </div>
        </Card>

        <Card padding="20px">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CreditCard size={20} className="text-muted-foreground mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-foreground">
                  크레딧 충전
                </span>
                <span className="text-[12px] text-muted-foreground">
                  결제 연동은 Phase 2에서 제공됩니다.
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              준비 중
            </Button>
          </div>
        </Card>

        <p className="text-[12px] text-muted-foreground">
          ※ 모든 Claude API 호출 작업은 1 크레딧이 차감됩니다 (이슈 분석, 기획서 업로드, 구현 현황 대조 등).
        </p>
      </div>
    </div>
  );
}
