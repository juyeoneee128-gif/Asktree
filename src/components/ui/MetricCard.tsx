export interface MetricCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  subtitle?: string;
}

export function MetricCard({ label, value, valueColor, subtitle }: MetricCardProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[12px] text-gray-400">{label}</span>
      <span
        className="text-[24px] font-bold mt-1"
        style={{ color: valueColor ?? 'var(--color-foreground)' }}
      >
        {value}
      </span>
      {subtitle && (
        <span className="text-[12px] text-gray-400 mt-0.5">{subtitle}</span>
      )}
    </div>
  );
}
