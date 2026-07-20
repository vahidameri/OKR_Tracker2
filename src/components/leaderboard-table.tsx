import { monthKeyLabel } from '@/lib/leaderboard';
import type { Standing } from '@/lib/leaderboard';
import { cn } from '@/lib/utils';

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM = [
  'from-amber-300/70 to-amber-100/40 ring-amber-300',
  'from-slate-300/60 to-slate-100/40 ring-slate-300',
  'from-orange-300/50 to-orange-100/30 ring-orange-300',
];

/** رتبه‌بندی تیم‌ها بر اساس pacing — کارتی و جذاب، در پنل تیم فقط‌خواندنی */
export function LeaderboardTable({
  standings,
  highlightTeamId,
}: {
  standings: Standing[];
  highlightTeamId?: string;
}) {
  if (standings.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">هنوز داده‌ای برای رتبه‌بندی نیست.</p>;
  }

  const maxPace = Math.max(1, ...standings.map((s) => Math.abs(s.paceScore)));

  return (
    <div className="space-y-2">
      {standings.map((s) => {
        const mine = highlightTeamId === s.teamId;
        const barPct = Math.round((Math.abs(s.paceScore) / maxPace) * 100);
        const ahead = s.paceScore >= 0;
        return (
          <div
            key={s.teamId}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 transition-colors',
              s.rank <= 3 ? `bg-gradient-to-l ${PODIUM[s.rank - 1]} ring-1` : 'border-border bg-card',
              mine && 'ring-2 ring-primary'
            )}
          >
            {/* رتبه / مدال */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 text-lg font-black shadow-sm">
              {MEDALS[s.rank - 1] ?? s.rank}
            </div>

            {/* نام تیم + نوار فاصله از برنامه */}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-bold">
                {s.teamName}
                {mine && <span className="text-xs font-normal text-primary">(تیم شما)</span>}
                {s.isLast && (
                  <span
                    className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-800"
                    title="تگ نمایشی برای روحیه‌ی تیمی — بدون اثر روی محاسبات"
                  >
                    🍦 بستنی این ماه با این تیمه
                  </span>
                )}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
                  <div
                    className={cn('h-full rounded-full', ahead ? 'bg-primary' : 'bg-[#D03B3B]')}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <span className={cn('text-xs font-bold tabular-nums', ahead ? 'text-primary' : 'text-[#D03B3B]')}>
                  {ahead ? '↑' : '↓'} {ahead ? '+' : ''}{s.paceScore}
                </span>
              </div>
            </div>

            {/* درصدها */}
            <div className="shrink-0 text-left">
              <p className="text-lg font-black tabular-nums">{s.progress}٪</p>
              <p className="text-[11px] text-muted-foreground">
                انتظار {s.expected !== null ? `${s.expected}٪` : '—'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** تاریخچه‌ی اسنپ‌شات‌های ماهانه (فشرده) */
export function LeaderboardHistory({
  historyByMonth,
}: {
  historyByMonth: Map<string, { teamName: string; rank: number; paceScore: number }[]>;
}) {
  const months = Array.from(historyByMonth.keys()).sort().reverse().slice(0, 6);
  if (months.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        هنوز اسنپ‌شات ماهانه‌ای ذخیره نشده — پایان هر ماه شمسی خودکار ثبت می‌شود.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {months.map((m) => (
        <div key={m} className="rounded-md border border-border p-2 text-xs">
          <p className="mb-1 font-bold">{monthKeyLabel(m)}</p>
          <p className="text-muted-foreground">
            {historyByMonth
              .get(m)!
              .sort((a, b) => a.rank - b.rank)
              .map((e) => `${e.rank}. ${e.teamName} (${e.paceScore > 0 ? '+' : ''}${e.paceScore})`)
              .join('  ·  ')}
          </p>
        </div>
      ))}
    </div>
  );
}
