export type StatusDotStatus =
  | 'connected'
  | 'disconnected'
  | 'implemented'
  | 'partial'
  | 'unimplemented'
  | 'api-disconnected';

export interface StatusDotProps {
  status: StatusDotStatus;
  size?: number;
}

const statusConfig: Record<StatusDotStatus, { color: string; defaultSize: number; outline?: boolean }> = {
  connected:        { color: '#16A34A', defaultSize: 8 },
  disconnected:     { color: '#DC2626', defaultSize: 8 },
  implemented:      { color: '#1E40AF', defaultSize: 6 },
  partial:          { color: '#C2410C', defaultSize: 6 },
  unimplemented:    { color: '#E7E5E4', defaultSize: 6, outline: true },
  'api-disconnected': { color: '#F97316', defaultSize: 8 },
};

export function StatusDot({ status, size }: StatusDotProps) {
  const config = statusConfig[status];
  const dotSize = size ?? config.defaultSize;

  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{
        width: dotSize,
        height: dotSize,
        backgroundColor: config.outline ? 'transparent' : config.color,
        border: config.outline ? `1.5px solid ${config.color}` : undefined,
      }}
    />
  );
}
