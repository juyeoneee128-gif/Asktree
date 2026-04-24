export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={[
        'animate-pulse bg-gray-200 rounded',
        className,
      ].join(' ')}
    />
  );
}

/**
 * 페이지 전체 로딩 placeholder.
 * "로딩 중..." 텍스트를 대체하는 공통 스켈레톤.
 */
export function PageSkeleton() {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="max-w-[1120px] mx-auto px-8 py-10 flex flex-col gap-6">
        <Skeleton className="h-7 w-48" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
