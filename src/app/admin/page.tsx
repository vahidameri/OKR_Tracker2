import { Activity, AlertTriangle, CheckCircle2, Circle, Gauge, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { AutoStatusBadge } from '@/components/ui/badge';
import { CheckinHeatmap } from '@/components/charts/checkin-heatmap';
import { Sparkline } from '@/components/charts/sparkline';
import { StatusDonut } from '@/components/charts/status-donut';
import { TeamBarChart } from '@/components/charts/team-bar-chart';
import { TrendChart } from '@/components/charts/trend-chart';
import { JalaliCalendar } from '@/components/jalali-calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatJalali, formatJalaliLong } from '@/lib/jalali';
import { LeaderboardHistory, LeaderboardTable } from '@/components/leaderboard-table';
import { computeStandings, getLeaderboardHistory } from '@/lib/leaderboard';
import {
  computeCompliance,
  computeObjectiveProgress,
  computePersistentBlockers,
  computeTrend,
  getDepartmentOverview,
} from '@/lib/okr-data';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const { overviews, departmentProgress, totalTkrs, teams, tkrs } = await getDepartmentOverview();

  const trend = computeTrend(tkrs);
  const objectives = computeObjectiveProgress(tkrs);
  const compliance = computeCompliance(teams, tkrs);
  const persistentBlockers = computePersistentBlockers(tkrs);
  const standings = computeStandings(overviews);
  const historyByMonth = await getLeaderboardHistory();

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

  const tiles = [
    { label: 'در مسیر', value: totals.onTrack, Icon: Circle, accent: 'text-emerald-600', bar: 'bg-emerald-500', ring: 'bg-emerald-50 text-emerald-600' },
    { label: 'در ریسک', value: totals.atRisk, Icon: AlertTriangle, accent: 'text-amber-600', bar: 'bg-amber-500', ring: 'bg-amber-50 text-amber-600' },
    { label: 'بلاک‌شده', value: totals.blocked, Icon: Activity, accent: 'text-[#D03B3B]', bar: 'bg-[#D03B3B]', ring: 'bg-red-50 text-[#D03B3B]' },
    { label: 'تکمیل‌شده', value: totals.completed, Icon: CheckCircle2, accent: 'text-[#2a78d6]', bar: 'bg-[#2a78d6]', ring: 'bg-blue-50 text-[#2a78d6]' },
  ];

  return (
    <div className="space-y-6">
      {/* سرصفحه */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">داشبورد دپارتمان</h1>
          <p className="text-sm text-muted-foreground">{formatJalaliLong(new Date())}</p>
        </div>
        <div className="no-print flex gap-2">
          <Link
            href="/admin/export"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            خروجی‌ها
          </Link>
          <Link
            href="/admin/report"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-muted"
          >
            گزارش چاپی / PDF
          </Link>
        </div>
      </div>

      {/* ۱) اعداد کلیدی — مهم‌ترین، بالای صفحه */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* هیرو: پیشرفت دپارتمان */}
        <Card className="relative overflow-hidden bg-gradient-to-bl from-primary/10 to-transparent lg:col-span-1">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-primary">
              <Gauge className="h-5 w-5" />
              <span className="text-xs font-bold">پیشرفت دپارتمان</span>
            </div>
            <p className="mt-2 text-4xl font-black text-primary">{departmentProgress}٪</p>
            {trendDelta !== null && (
              <p
                className={`mt-1 flex items-center gap-1 text-xs font-bold ${
                  trendDelta >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {trendDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(trendDelta)} واحد نسبت به هفته قبل
              </p>
            )}
          </CardContent>
        </Card>

        {tiles.map((t) => (
          <Card key={t.label} className="relative overflow-hidden">
            <span className={`absolute inset-y-0 right-0 w-1 ${t.bar}`} />
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className={`text-4xl font-black ${t.accent}`}>{t.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">KR {t.label}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${t.ring}`}>
                <t.Icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ۲) هشدارها — نیازمند اقدام فوری */}
      {persistentBlockers.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" /> بلاکرهای پایدار — نیازمند مداخله
            </CardTitle>
            <CardDescription className="text-red-700">
              این KRها دو هفته‌ی متوالی یا بیشتر در وضعیت «بلاک‌شده» گزارش شده‌اند.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {persistentBlockers.map((b, i) => (
              <div key={i} className="rounded-lg bg-white/70 p-3 text-sm">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {b.teamName} — {b.krTitle}
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                    {b.weeks} هفته متوالی
                  </span>
                </p>
                {b.blocker && <p className="mt-1 text-justify text-xs text-red-800">آخرین بلاکر: {b.blocker}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ۳) چیدمان دوستونه بر اساس اهمیت — ستون اصلی (چپ/عریض) و کناری (راست) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ستون اصلی: نمودارهای عملکرد */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>پیشرفت تیم‌ها</CardTitle>
              <CardDescription>میانگین وزنی پیشرفت KRهای هر تیم ({totalTkrs} رکورد KR-تیم)</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamBarChart data={overviews.map((o) => ({ name: o.teamName, progress: o.progress }))} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>روند هفتگی دپارتمان</CardTitle>
              <CardDescription>پیشرفت وزنی تجمیعی هفته‌به‌هفته</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={trend} />
            </CardContent>
          </Card>

          {objectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>پیشرفت اهداف</CardTitle>
                <CardDescription>میانگین وزنی سهم‌های تیمی هر هدف</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {objectives.map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-52 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                        {o.title}
                        <AutoStatusBadge status={o.autoStatus} expected={o.expected} />
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {o.period} · وزن {o.weight} · {o.krCount} نتیجه کلیدی
                        {o.expected !== null && ` · انتظار زمانی: ${o.expected}٪`}
                      </p>
                    </div>
                    <div className="w-full sm:w-64">
                      <ProgressBar value={o.progress} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ستون کناری: توزیع وضعیت، لیدربورد، تقویم */}
        <div className="space-y-6">
          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>🏆 لیدربورد تیم‌ها</CardTitle>
              <CardDescription>رتبه‌بندی بر اساس فاصله از برنامه (pacing)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LeaderboardTable standings={standings} />
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-sm font-bold">تاریخچه‌ی ماه‌های قبل</p>
                <LeaderboardHistory historyByMonth={historyByMonth} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تقویم</CardTitle>
            </CardHeader>
            <CardContent>
              <JalaliCalendar />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ۴) هیت‌مپ کل فصل — عریض */}
      <Card>
        <CardHeader>
          <CardTitle>هیت‌مپ هفتگی تیم × هفته</CardTitle>
          <CardDescription>
            رنگ = وضعیت pacing تیم در پایان هر هفته · عدد = KRهای ثبت‌شده / کل · خط‌چین = عدم ثبت (۱۲ هفته اخیر)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckinHeatmap weeks={compliance.weeks} rows={compliance.rows} />
        </CardContent>
      </Card>

      {/* ۵) کارت تیم‌ها (drill-down) */}
      <div>
        <h2 className="mb-3 text-lg font-black">تیم‌ها</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {overviews.map((o) => {
            const teamTrend = computeTrend(tkrs.filter((t) => t.teamId === o.teamId));
            return (
              <Link key={o.teamId} href={`/admin/teams/${o.teamId}`}>
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span>{o.teamName}</span>
                      <span className="text-xs font-normal text-muted-foreground">{o.krCount} KR</span>
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      مسئول: {o.leadName ?? '—'}
                      <AutoStatusBadge status={o.autoStatus} expected={o.expected} />
                    </CardDescription>
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
    </div>
  );
}
