import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { monthKeyLabel } from '@/lib/leaderboard';
import type { Standing } from '@/lib/leaderboard';
import { cn } from '@/lib/utils';

const MEDALS = ['🥇', '🥈', '🥉'];

function paceLabel(p: number) {
  if (p > 0) return <span className="font-bold text-emerald-700">+{p}</span>;
  if (p < 0) return <span className="font-bold text-red-700">{p}</span>;
  return <span className="font-bold text-muted-foreground">۰</span>;
}

/** جدول رتبه‌بندی تیم‌ها بر اساس pacing — در پنل تیم فقط‌خواندنی است */
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
  return (
    <Table>
      <THead>
        <TR>
          <TH>رتبه</TH>
          <TH>تیم</TH>
          <TH>پیشرفت</TH>
          <TH>انتظار زمانی</TH>
          <TH>فاصله از برنامه</TH>
        </TR>
      </THead>
      <TBody>
        {standings.map((s) => (
          <TR
            key={s.teamId}
            className={cn(highlightTeamId === s.teamId && 'bg-primary/5 font-bold')}
          >
            <TD className="whitespace-nowrap">
              {MEDALS[s.rank - 1] ?? ''} {s.rank}
            </TD>
            <TD>
              {s.teamName}
              {highlightTeamId === s.teamId && <span className="mr-1 text-xs text-primary">(تیم شما)</span>}
              {s.isLast && (
                <span
                  className="mr-2 inline-flex items-center rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-800"
                  title="تگ نمایشی برای روحیه‌ی تیمی — بدون اثر روی محاسبات"
                >
                  🍦 بستنی این ماه با این تیمه
                </span>
              )}
            </TD>
            <TD className="tabular-nums">{s.progress}٪</TD>
            <TD className="tabular-nums">{s.expected !== null ? `${s.expected}٪` : '—'}</TD>
            <TD className="tabular-nums">{paceLabel(s.paceScore)}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
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
