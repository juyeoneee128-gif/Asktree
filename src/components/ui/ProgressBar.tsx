export interface ProgressBarProps {
  /** 0~100 */
  value: number;
  /** CSS color (기본 --primary) */
  color?: string;
}

export function ProgressBar({ value, color }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${clamped}%`,
          backgroundColor: color ?? 'var(--color-primary)',
        }}
      />
    </div>
  );
}
