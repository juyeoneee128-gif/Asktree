export interface TechDetailCardProps {
  file: string;
  basis: string;
  time: string;
}

export function TechDetailCard({ file, basis, time }: TechDetailCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="grid grid-cols-3 gap-4">
        <DetailColumn label="관련 파일" value={file} />
        <DetailColumn label="감지 근거" value={basis} />
        <DetailColumn label="감지 시간" value={time} />
      </div>
    </div>
  );
}

function DetailColumn({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[12px] text-gray-400">{label}</span>
      <span className="text-[14px] font-semibold text-foreground mt-1">{value}</span>
    </div>
  );
}
