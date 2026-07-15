import Link from 'next/link';
import { CheckinHeatmap } from '@/components/charts/checkin-heatmap';
import { Sparkline } from '@/components/charts/sparkline';
import { StatusDonut } from '@/components/charts/status-donut';
import { TeamBarChart } from '@/components/charts/team-bar-chart';
import { TrendChart } from '@/components/charts/trend-chart';
import { JalaliCalendar } from '@/components/jalali-calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatJalali, formatJalaliLong } from '@/lib/jalali';
import {
  computeCompliance,
  computeObjectiveProgress,
  computeTrend,
  getDepartmentOverview,
} from '@/lib/okr-data';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const { overviews, departmentProgress, totalTkrs, teams, tkrs } = await getDepartmentOverview();

  const trend = computeTrend(tkrs);
  const objectives = computeObjectiveProgress(tkrs);
  const compliance = computeCompliance(teams, tkrs);

  const totals = overviews.reduce(
    (acc, o) => ({
      onTrack: acc.onTrack + o.statusCounts.ON_TRACK,
      atRisk: acc.atRisk + o.statusCounts.AT_RISK,
      blocked: acc.blocked + o.statusCounts.BLOCKED,
      completed: acc.completed + o.statusCounts.COMPLETED,
    }),
    { onTrack: 0, atRisk: 0, blocked: 0, completed: 0 }
  );
  const withCheckIn = totals.onTrack + totals.atRisk + totals.blocked + totals.completed;
  const noCheckIn = totalTkrs - withCheckIn;
  const trendDelta =
    trend.length >= 2 ? trend[trend.length - 1].progress - trend[trend.length - 2].progress : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">داشبورد دپارتمان</h1>
          <p className="text-sm text-muted-foreground">{formatJalaliLong(new Date())}</p>
        </div>
        <div className="no-print flex gap-2">
          <Link
            href="/admin/export"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            خروجی‌ها
          </Link>
          <Link
            href="/admin/report"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            گزارش چاپی / PDF
          </Link>
        </div>
      </div>

      {/* ردیف اعداد کلیدی */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-4xl font-black text-primary">{departmentProgress}٪</p>
            <p className="mt-1 text-sm text-muted-foreground">پیشرفت وزنی دپارتمان</p>
            {trendDelta !== null && (
              <p className={`mt-1 text-xs font-bold ${trendDelta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {trendDelta >= 0 ? `▲ ${trendDelta}` : `▼ ${Math.abs(trendDelta)}`} واحد نسبت به هفته قبل
              </p>
            )}
          </CardContent>
        </Card>
        {[
          { label: 'در مسیر', icon: '●', value: totals.onTrack, color: 'text-[#0ca30c]' },
          { label: 'در ریسک', icon: '▲', value: totals.atRisk, color: 'text-amber-600' },
          { label: 'بلاک‌شده', icon: '■', value: totals.blocked, color: 'text-[#d03b3b]' },
          { label: 'تکمیل‌شده', icon: '✔', value: totals.completed, color: 'text-[#2a78d6]' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 text-center">
              <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {s.icon} KR {s.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* نمودارها: میله‌ای تیم‌ها + دونات وضعیت */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>پیشرفت تیم‌ها</CardTitle>
            <CardDescription>میانگین وزنی پیشرفت KRهای هر تیم ({totalTkrs} رکورد KR-تیم)</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamBarChart data={overviews.map((o) => ({ name: o.teamName, progress: o.progress }))} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>توزیع وضعیت KRها</CardTitle>
            <CardDescription>بر اساس آخرین چک‌این هر KR-تیم</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonut
              counts={{
                ON_TRACK: totals.onTrack,
                AT_RISK: totals.atRisk,
                BLOCKED: totals.blocked,
                COMPLETED: totals.completed,
              }}
              noCheckIn={noCheckIn}
            />
          </CardContent>
        </Card>
      </div>

      {/* روند هفتگی + تقویم */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>روند هفتگی دپارتمان</CardTitle>
            <CardDescription>پیشرفت وزنی تجمیعی هفته‌به‌هفته</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>تقویم</CardTitle>
          </CardHeader>
          <CardContent>
            <JalaliCalendar />
          </CardContent>
        </Card>
      </div>

      {/* پیشرفت اهداف */}
      {objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>پیشرفت اهداف (Objectives)</CardTitle>
            <CardDescription>میانگین وزنی سهم‌های تیمی هر هدف</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {objectives.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3">
                <div className="min-w-52 flex-1">
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.period} · وزن {o.weight} · {o.krCount} نتیجه کلیدی
                  </p>
                </div>
                <div className="w-full sm:w-72">
                  <ProgressBar value={o.progress} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* هیت‌مپ نظم ثبت */}
      <Card>
        <CardHeader>
          <CardTitle>نظم ثبت چک‌این هفتگی</CardTitle>
          <CardDescription>سهم KRهای ثبت‌شده‌ی هر تیم در هر هفته (۱۰ هفته اخیر)</CardDescription>
        </CardHeader>
        <CardContent>
          <CheckinHeatmap weeks={compliance.weeks} rows={compliance.rows} />
        </CardContent>
      </Card>

      {/* کارت تیم‌ها با اسپارک‌لاین */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overviews.map((o) => {
          const teamTrend = computeTrend(tkrs.filter((t) => t.teamId === o.teamId));
          return (
            <Link key={o.teamId} href={`/admin/teams/${o.teamId}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>{o.teamName}</span>
                    <span className="text-xs font-normal text-muted-foreground">{o.krCount} KR</span>
                  </CardTitle>
                  <CardDescription>مسئول: {o.leadName ?? '—'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ProgressBar value={o.progress} />
                  <Sparkline data={teamTrend.map((t) => ({ progress: t.progress }))} />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                      در مسیر: {o.statusCounts.ON_TRACK}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                      ریسک: {o.statusCounts.AT_RISK}
                    </span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">
                      بلاک: {o.statusCounts.BLOCKED}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
                      تکمیل: {o.statusCounts.COMPLETED}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    آخرین چک‌این: {o.lastCheckInAt ? formatJalali(o.lastCheckInAt) : 'ثبت نشده'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
