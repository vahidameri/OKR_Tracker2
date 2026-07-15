import { weekLabel } from '@/lib/jalali';
import type { ComplianceRow } from '@/lib/okr-data';
import { AUTO_STATUS_LABELS } from '@/lib/progress';

/**
 * هیت‌مپ تیم × هفته: رنگ هر خانه وضعیت pacing تیم در پایان آن هفته است و متن خانه
 * تعداد KRهای ثبت‌شده‌ی همان هفته. خانه‌ی بدون ثبت با حاشیه‌ی خط‌چین و «—» مشخص می‌شود
 * تا معنا فقط با رنگ حمل نشود.
 */

const STATUS_CELL: Record<string, { bg: string; ink: string; label: string }> = {
  AHEAD: { bg: '#cde2fb', ink: '#0d366b', label: AUTO_STATUS_LABELS.AHEAD },
  ON_SCHEDULE: { bg: '#c9ecc9', ink: '#0b3d0b', label: AUTO_STATUS_LABELS.ON_SCHEDULE },
  AT_RISK: { bg: '#fde6b3', ink: '#5c4200', label: AUTO_STATUS_LABELS.AT_RISK },
  BEHIND: { bg: '#f6c9c9', ink: '#5c0f0f', label: AUTO_STATUS_LABELS.BEHIND },
};
const EMPTY = { bg: '#f0efec', ink: '#898781' };

export function CheckinHeatmap({ weeks, rows }: { weeks: string[]; rows: ComplianceRow[] }) {
  if (weeks.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">هنوز چک‌اینی ثبت نشده است.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate text-xs" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th className="p-1 text-right font-bold text-muted-foreground">تیم</th>
            {weeks.map((w) => (
              <th key={w} className="p-1 text-center font-normal text-muted-foreground">
                {weekLabel(new Date(w))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.teamId}>
              <td className="whitespace-nowrap p-1 text-right font-medium">{row.teamName}</td>
              {row.cells.map((cell) => {
                const submitted = cell.submitted > 0;
                const style = submitted && cell.autoStatus ? STATUS_CELL[cell.autoStatus] : EMPTY;
                const statusText =
                  submitted && cell.autoStatus ? STATUS_CELL[cell.autoStatus].label : 'بدون ثبت';
                return (
                  <td
                    key={cell.weekIso}
                    className="rounded-md p-1.5 text-center tabular-nums"
                    style={{
                      background: style.bg,
                      color: style.ink,
                      minWidth: 46,
                      border: submitted ? 'none' : '1px dashed #c3c2b7',
                    }}
                    title={`${row.teamName} — هفته ${weekLabel(new Date(cell.weekIso))}: ${statusText} · ${cell.submitted} از ${cell.total} KR ثبت شده · پیشرفت تجمعی ${cell.progressAtWeek}٪`}
                  >
                    {cell.total === 0 ? '·' : submitted ? `${cell.submitted}/${cell.total}` : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {Object.entries(STATUS_CELL).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="inline-block h-3 w-4 rounded-sm" style={{ background: v.bg }} />
            {v.label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-4 rounded-sm border border-dashed" style={{ background: EMPTY.bg }} />
          بدون ثبت چک‌این
        </span>
        <span>· عدد هر خانه: KRهای ثبت‌شده / کل</span>
      </div>
    </div>
  );
}
