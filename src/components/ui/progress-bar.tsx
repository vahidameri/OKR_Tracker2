import { cn } from '@/lib/utils';
import { Pct } from '@/components/ui/pct';

/** نوار پیشرفت: ۱۰۰٪=سبز، بالا=فیروزه‌ای، میانه=کهربایی، پایین=قرمز */
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
  const color =
    clamped >= 100
      ? 'bg-emerald-500'
      : clamped >= 60
        ? 'bg-primary'
        : clamped >= 30
          ? 'bg-amber-500'
          : 'bg-red-500';
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
      <Pct value={clamped} className="w-10 text-left text-xs font-bold text-muted-foreground" />
    </div>
  );
}
