import { cn } from '@/lib/utils';

/** نوار پیشرفت به سبک مرجع: ضخیم، گرد، سبزآبی؛ کهربایی/قرمز وقتی عقب است */
export function ProgressBar({
  value,
  className,
  size = 'md',
}: {
  value: number;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const color = clamped >= 60 ? 'bg-primary' : clamped >= 30 ? 'bg-amber-500' : 'bg-[#D03B3B]';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex-1 overflow-hidden rounded-full bg-muted',
          size === 'md' ? 'h-2.5' : 'h-2'
        )}
      >
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-10 text-left text-xs font-bold tabular-nums text-muted-foreground">{clamped}٪</span>
    </div>
  );
}
