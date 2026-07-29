import { KrStatusTable, type KrStatusRow } from '@/components/admin/kr-status-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { formatJalali, formatJalaliLong } from '@/lib/jalali';
import {
  fetchAllTkrs,
  getDepartmentOverview,
  latestValueLabel,
  tkrAutoStatus,
  tkrExpected,
  tkrProgress,
} from '@/lib/okr-data';
import { METRIC_LABELS } from '@/lib/progress';
import { formatCompact } from '@/lib/utils';
import { PrintButton } from './print-button';

export const dynamic = 'force-dynamic';

/** گزارش چاپی: با دکمه چاپ مرورگر به PDF تبدیل می‌شود (بدون سرویس خارجی) */
export default async function ReportPage() {
  const [{ overviews, departmentProgress }, tkrs] = await Promise.all([
    getDepartmentOverview(),
    fetchAllTkrs(),
  ]);

  // تیم‌های یکتا برای فیلتر چک‌باکسی
  const teamMap = new Map<string, string>();
  for (const t of tkrs) teamMap.set(t.teamId, t.team.name);
  const teamList = Array.from(teamMap, ([id, name]) => ({ id, name }));

  const krRows: KrStatusRow[] = tkrs.map((tkr) => {
    const target = tkr.targetValueOverride ?? tkr.keyResult.targetValue;
    return {
      id: tkr.id,
      teamId: tkr.teamId,
      teamName: tkr.team.name,
      objectiveTitle: tkr.keyResult.objective.title,
      krTitle: tkr.keyResult.title,
      metricLabel: METRIC_LABELS[tkr.keyResult.metricType],
      targetLabel:
        tkr.keyResult.metricType === 'NUMERIC'
          ? `${formatCompact(target)} ${tkr.keyResult.unit ?? ''}`
          : tkr.keyResult.metricType === 'BOOLEAN'
            ? tkr.keyResult.targetBoolean === false
              ? 'خیر'
              : 'بله'
            : '—',
      valueLabel: latestValueLabel(tkr),
      progress: tkrProgress(tkr),
      recordedStatus: tkr.checkIns[0]?.progressStatus ?? null,
      autoStatus: tkrAutoStatus(tkr),
      expected: tkrExpected(tkr),
    };
  });

  return (
    <div className="space-y-6 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">گزارش وضعیت OKR — دپارتمان محصول و تکنولوژی</h1>
          <p className="text-sm text-muted-foreground">
            تاریخ گزارش: {formatJalaliLong(new Date())} · پیشرفت وزنی کل دپارتمان: {departmentProgress}٪
          </p>
        </div>
        <PrintButton />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>خلاصه تیم‌ها</CardTitle>
          <CardDescription>پیشرفت و توزیع وضعیت هر تیم در یک نگاه</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>تیم</TH>
                <TH>مسئول</TH>
                <TH>پیشرفت</TH>
                <TH>در مسیر</TH>
                <TH>در ریسک</TH>
                <TH>بلاک‌شده</TH>
                <TH>تکمیل‌شده</TH>
                <TH>آخرین چک‌این</TH>
              </TR>
            </THead>
            <TBody>
              {overviews.map((o) => (
                <TR key={o.teamId}>
                  <TD className="font-medium">{o.teamName}</TD>
                  <TD>{o.leadName ?? '—'}</TD>
                  <TD className="font-bold">{o.progress}٪</TD>
                  <TD>{o.statusCounts.ON_TRACK}</TD>
                  <TD>{o.statusCounts.AT_RISK}</TD>
                  <TD>{o.statusCounts.BLOCKED}</TD>
                  <TD>{o.statusCounts.COMPLETED}</TD>
                  <TD>{o.lastCheckInAt ? formatJalali(o.lastCheckInAt) : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>آخرین وضعیت نتایج کلیدی</CardTitle>
          <CardDescription>جزئیات هر KR با فیلتر تیمی — قابل مرتب‌سازی با تیک تیم‌ها</CardDescription>
        </CardHeader>
        <CardContent>
          <KrStatusTable rows={krRows} teams={teamList} />
        </CardContent>
      </Card>
    </div>
  );
}
