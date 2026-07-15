import { cn } from '@/lib/utils';

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const color =
    clamped >= 100 ? 'bg-blue-600' : clamped >= 60 ? 'bg-emerald-600' : clamped >= 30 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-10 text-left text-xs font-bold tabular-nums">{clamped}٪</span>
    </div>
  );
}
