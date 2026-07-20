import { formatJalali } from '@/lib/jalali';

/**
 * نوار زمانی دوره: زمان سپری‌شده و باقی‌مانده از فصل/دوره‌ی جاری.
 */
export function CycleTimeBar({
  name,
  start,
  end,
}: {
  name: string;
  start: string;
  end: string;
}) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  const total = Math.max(e - s, 1);
  const elapsedRatio = Math.min(Math.max((now - s) / total, 0), 1);
  const elapsedPct = Math.round(elapsedRatio * 100);
  const day = 86400000;
  const passedDays = Math.max(0, Math.round((Math.min(now, e) - s) / day));
  const remainingDays = Math.max(0, Math.round((e - now) / day));

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold">{name}</span>
        <span className="text-xs text-muted-foreground">{elapsedPct}٪ سپری شده</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${elapsedPct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>🟢 {passedDays} روز سپری‌شده</span>
        <span>{remainingDays} روز باقی‌مانده ⏳</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatJalali(start)}</span>
        <span>{formatJalali(end)}</span>
      </div>
    </div>
  );
}
