import {
  AlertTriangle,
  ArrowUpLeft,
  CheckCircle2,
  Circle,
  Gauge,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { AutoStatusBadge } from '@/components/ui/badge';
import { Sparkline } from '@/components/charts/sparkline';
import { StatusDonut } from '@/components/charts/status-donut';
import { TrendChart } from '@/components/charts/trend-chart';
import { JalaliCalendar } from '@/components/jalali-calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatJalali, formatJalaliLong } from '@/lib/jalali';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { computeStandings } from '@/lib/leaderboard';
import { computePersistentBlockers, computeTrend, getDepartmentOverview } from '@/lib/okr-data';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const { overviews, departmentProgress, totalTkrs, tkrs } = await getDepartmentOverview();

  const trend = computeTrend(tkrs);
  const persistentBlockers = computePersistentBlockers(tkrs);
  const standings = computeStandings(overviews);

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
    { key: 'ON_TRACK', label: 'در مسیر', value: totals.onTrack, Icon: Circle, accent: 'text-emerald-600', bar: 'bg-emerald-500', ring: 'bg-emerald-50 text-emerald-600' },
    { key: 'AT_RISK', label: 'در ریسک', value: totals.atRisk, Icon: AlertTriangle, accent: 'text-amber-600', bar: 'bg-amber-500', ring: 'bg-amber-50 text-amber-600' },
    { key: 'BLOCKED', label: 'بلاک‌شده', value: totals.blocked, Icon: AlertTriangle, accent: 'text-[#D03B3B]', bar: 'bg-[#D03B3B]', ring: 'bg-red-50 text-[#D03B3B]' },
    { key: 'COMPLETED', label: 'تکمیل‌شده', value: totals.completed, Icon: CheckCircle2, accent: 'text-[#2a78d6]', bar: 'bg-[#2a78d6]', ring: 'bg-blue-50 text-[#2a78d6]' },
  ];

  return (
    <div className="space-y-5">
      {/* سرصفحه */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">داشبورد دپارتمان</h1>
          <p className="text-sm text-muted-foreground">{formatJalaliLong(new Date())}</p>
        </div>
        <div className="no-print flex gap-2">
          <Link
            href="/admin/export"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            خروجی‌ها
          </Link>
          <Link
            href="/admin/report"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold transition-colors hover:bg-muted"
          >
            گزارش چاپی / PDF
          </Link>
        </div>
      </div>

      {/* KPIها — کلیک‌پذیر */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {/* هیرو: پیشرفت دپارتمان → گزارش */}
        <Link href="/admin/report" className="group col-span-2 lg:col-span-1">
          <Card className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent ring-1 ring-primary/10 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-primary/30">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between text-primary">
                <span className="flex items-center gap-2 text-xs font-bold">
                  <Gauge className="h-4 w-4" /> پیشرفت دپارتمان
                </span>
                <ArrowUpLeft className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
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
        </Link>

        {tiles.map((t) => (
          <Link key={t.key} href={`/admin/checkins?status=${t.key}`} className="group">
            <Card className="relative h-full overflow-hidden rounded-2xl transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <span className={`absolute inset-y-0 right-0 w-1 ${t.bar}`} />
              <CardContent className="flex items-center justify-between pt-5">
                <div>
                  <p className={`text-3xl font-black ${t.accent}`}>{t.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">KR {t.label}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${t.ring}`}>
                  <t.Icon className="h-5 w-5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* هشدار بلاکرهای پایدار */}
      {persistentBlockers.length > 0 && (
        <Card className="rounded-2xl border-red-200 bg-red-50/70">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" /> بلاکرهای پایدار — نیازمند مداخله
            </CardTitle>
            <CardDescription className="text-red-700">
              این KRها دو هفته‌ی متوالی یا بیشتر «بلاک‌شده» گزارش شده‌اند.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {persistentBlockers.map((b, i) => (
              <div key={i} className="rounded-xl bg-white/80 p-3 text-sm">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {b.teamName} — {b.krTitle}
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{b.weeks} هفته</span>
                </p>
                {b.blocker && <p className="mt-1 text-justify text-xs text-red-800">{b.blocker}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* روند هفتگی (عریض) + توزیع وضعیت */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle>روند هفتگی دپارتمان</CardTitle>
            <CardDescription>پیشرفت وزنی تجمیعی هفته‌به‌هفته</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} height={300} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>توزیع وضعیت KRها</CardTitle>
            <CardDescription>بر اساس آخرین چک‌این هر KR-تیم</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonut
              counts={{ ON_TRACK: totals.onTrack, AT_RISK: totals.atRisk, BLOCKED: totals.blocked, COMPLETED: totals.completed }}
              noCheckIn={noCheckIn}
            />
          </CardContent>
        </Card>
      </div>

      {/* لیدربورد (عریض) + تقویم */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle>🏆 لیدربورد تیم‌ها</CardTitle>
            <CardDescription>رتبه‌بندی بر اساس فاصله از برنامه (pacing)</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardTable standings={standings} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>تقویم</CardTitle>
          </CardHeader>
          <CardContent>
            <JalaliCalendar />
          </CardContent>
        </Card>
      </div>

      {/* کارت تیم‌ها (drill-down) */}
      <div>
        <h2 className="mb-3 text-lg font-black">تیم‌ها</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {overviews.map((o) => {
            const teamTrend = computeTrend(tkrs.filter((t) => t.teamId === o.teamId));
            return (
              <Link key={o.teamId} href={`/admin/teams/${o.teamId}`} className="group">
                <Card className="h-full rounded-2xl transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
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
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">مسیر {o.statusCounts.ON_TRACK}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">ریسک {o.statusCounts.AT_RISK}</span>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">بلاک {o.statusCounts.BLOCKED}</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">تکمیل {o.statusCounts.COMPLETED}</span>
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
