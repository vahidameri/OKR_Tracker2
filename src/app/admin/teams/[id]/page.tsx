import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { TrendChart } from '@/components/charts/trend-chart';
import { formatJalali } from '@/lib/jalali';
import { getTeamOkrs, getWeeklyTrend, tkrProgress } from '@/lib/okr-data';
import { prisma } from '@/lib/prisma';
import { METRIC_LABELS, weightedProgress } from '@/lib/progress';
import { formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TeamDrilldown({ params }: { params: { id: string } }) {
  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) notFound();

  const [okrs, trend] = await Promise.all([getTeamOkrs(params.id), getWeeklyTrend(params.id)]);
  const allTkrs = okrs.flatMap((o) => o.items);
  const teamProgress = weightedProgress(allTkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) })));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">تیم {team.name}</h1>
          <p className="text-sm text-muted-foreground">مسئول: {team.leadName ?? '—'}</p>
        </div>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← بازگشت به داشبورد
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-4xl font-black text-primary">{teamProgress}٪</p>
            <p className="mt-2 text-sm text-muted-foreground">پیشرفت وزنی تیم</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle>روند هفتگی تیم</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
      </div>

      {okrs.length === 0 && (
        <Card>
          <CardContent className="pt-5 text-center text-muted-foreground">
            هنوز OKRی به این تیم تخصیص داده نشده است.
          </CardContent>
        </Card>
      )}

      {okrs.map(({ objective, items }) => (
        <Card key={objective.id}>
          <CardHeader>
            <CardTitle>{objective.title}</CardTitle>
            <CardDescription>
              دوره: {objective.period} · وزن هدف: {objective.weight}
              {objective.description ? ` · ${objective.description}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>نتیجه کلیدی</TH>
                  <TH>نوع</TH>
                  <TH>وزن تیمی</TH>
                  <TH>تارگت</TH>
                  <TH>آخرین مقدار</TH>
                  <TH>پیشرفت</TH>
                  <TH>وضعیت</TH>
                  <TH>آخرین چک‌این</TH>
                </TR>
              </THead>
              <TBody>
                {items.map((tkr) => {
                  const latest = tkr.checkIns[0];
                  const target = tkr.targetValueOverride ?? tkr.keyResult.targetValue;
                  return (
                    <TR key={tkr.id}>
                      <TD className="max-w-xs">
                        <p className="font-medium">{tkr.keyResult.title}</p>
                        {tkr.keyResult.isShared && (
                          <span className="text-xs text-violet-600">KR مشترک بین چند تیم</span>
                        )}
                        {latest?.blockerDescription && (
                          <p className="mt-1 text-xs text-red-600">بلاکر: {latest.blockerDescription}</p>
                        )}
                      </TD>
                      <TD>{METRIC_LABELS[tkr.keyResult.metricType]}</TD>
                      <TD>{tkr.weight}</TD>
                      <TD>
                        {tkr.keyResult.metricType === 'NUMERIC'
                          ? `${formatCompact(target)} ${tkr.keyResult.unit ?? ''}`
                          : '—'}
                      </TD>
                      <TD>
                        {tkr.keyResult.metricType === 'NUMERIC'
                          ? formatCompact(latest?.currentValue)
                          : tkr.keyResult.metricType === 'BOOLEAN'
                            ? latest
                              ? latest.booleanValue
                                ? 'بله'
                                : 'خیر'
                              : '—'
                            : latest?.textValue ?? '—'}
                      </TD>
                      <TD className="min-w-[130px]">
                        <ProgressBar value={tkrProgress(tkr)} />
                      </TD>
                      <TD>{latest ? <StatusBadge status={latest.progressStatus} /> : '—'}</TD>
                      <TD className="text-xs text-muted-foreground">
                        {latest ? formatJalali(latest.weekStartDate) : 'ثبت نشده'}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
