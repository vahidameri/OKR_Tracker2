import { weekLabel } from '@/lib/jalali';
import type { ComplianceRow } from '@/lib/okr-data';
import { chartTheme, seqColor, seqInk } from './theme';

/**
 * هیت‌مپ نظم ثبت چک‌این: سطر = تیم، ستون = هفته، رنگ = سهم KRهای ثبت‌شده (رمپ آبی تک‌رنگ).
 * عدد داخل هر خانه، مقدار دقیق را می‌دهد تا معنا فقط با رنگ حمل نشود.
 */
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
              {row.cells.map((cell) => (
                <td
                  key={cell.weekIso}
                  className="rounded-md p-1.5 text-center tabular-nums"
                  style={{ background: seqColor(cell.ratio), color: seqInk(cell.ratio), minWidth: 44 }}
                  title={`${row.teamName} — هفته ${weekLabel(new Date(cell.weekIso))}: ${cell.submitted} از ${cell.total} KR ثبت شده`}
                >
                  {cell.total === 0 ? '—' : `${cell.submitted}/${cell.total}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <span>ثبت کمتر</span>
        <span className="inline-block h-3 w-4 rounded-sm" style={{ background: chartTheme.empty }} />
        {chartTheme.seq.slice(0, 6).map((c) => (
          <span key={c} className="inline-block h-3 w-4 rounded-sm" style={{ background: c }} />
        ))}
        <span>ثبت کامل‌تر</span>
      </div>
    </div>
  );
}
