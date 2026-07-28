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
import { CycleTimeBar } from '@/components/cycle-time-bar';
import { JalaliCalendar } from '@/components/jalali-calendar';
import { Pct } from '@/components/ui/pct';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatJalaliLong } from '@/lib/jalali';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { computeStandings } from '@/lib/leaderboard';
import { computePersistentBlockers, computeTrend, getDepartmentOverview } from '@/lib/okr-data';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const { overviews, departmentProgress, totalTkrs, tkrs } = await getDepartmentOverview();

  const trend = computeTrend(tkrs);
  const persistentBlockers = computePersistentBlockers(tkrs);
  const standings = computeStandings(overviews);

  // دوره‌ی جاری برای نوار زمانی: دوره‌ی فعالی که امروز داخل بازه‌اش است، وگرنه جدیدترین
  const now = new Date();
  const activeCycles = await prisma.cycle.findMany({ where: { isActive: true }, orderBy: { startDate: 'desc' } });
  const currentCycle =
    activeCycles.find((c) => c.startDate <= now && c.endDate >= now) ?? activeCycles[0] ?? null;

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
    { key: 'ON_TRACK', label: 'در مسیر', value: totals.onTrack, Icon: Circle, accent: 'text-teal-600', bar: 'bg-teal-500', ring: 'bg-teal-50 text-teal-600' },
    { key: 'AT_RISK', label: 'در ریسک', value: totals.atRisk, Icon: AlertTriangle, accent: 'text-amber-600', bar: 'bg-amber-500', ring: 'bg-amber-50 text-amber-600' },
    { key: 'BLOCKED', label: 'بلاک‌شده', value: totals.blocked, Icon: AlertTriangle, accent: 'text-red-600', bar: 'bg-red-500', ring: 'bg-red-50 text-red-600' },
    { key: 'COMPLETED', label: 'تکمیل‌شده', value: totals.completed, Icon: CheckCircle2, accent: 'text-emerald-600', bar: 'bg-emerald-500', ring: 'bg-emerald-50 text-emerald-600' },
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
              <p className="mt-2 text-4xl font-black text-primary"><Pct value={departmentProgress} /></p>
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
              <ArrowUpLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
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
        <Card className="flex h-full flex-col rounded-2xl">
          <CardHeader>
            <CardTitle>تقویم</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <JalaliCalendar />
            {currentCycle && (
              <div className="mt-auto border-t border-border pt-5">
                <CycleTimeBar
                  name={currentCycle.name}
                  start={currentCycle.startDate.toISOString()}
                  end={currentCycle.endDate.toISOString()}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* کارت تیم‌ها (drill-down) */}
      <div>
        <h2 className="mb-3 text-lg font-black">تیم‌ها</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {overviews.map((o) => {
            const teamTrend = computeTrend(tkrs.filter((t) => t.teamId === o.teamId));
            const tone =
              o.progress >= 60 ? 'primary' : o.progress >= 30 ? 'amber' : 'red';
            const ring =
              tone === 'primary' ? 'text-primary' : tone === 'amber' ? 'text-amber-500' : 'text-red-500';
            const bar =
              tone === 'primary' ? 'bg-primary' : tone === 'amber' ? 'bg-amber-500' : 'bg-red-500';
            const wash =
              tone === 'primary'
                ? 'from-primary/[0.07]'
                : tone === 'amber'
                ? 'from-amber-500/[0.07]'
                : 'from-red-500/[0.07]';
            const hoverRing =
              tone === 'primary'
                ? 'group-hover:ring-primary/30'
                : tone === 'amber'
                ? 'group-hover:ring-amber-400/40'
                : 'group-hover:ring-red-400/40';
            return (
              <Link key={o.teamId} href={`/admin/teams/${o.teamId}`} className="group">
                <Card
                  className={`relative h-full overflow-hidden rounded-2xl bg-gradient-to-b ${wash} to-transparent ring-1 ring-transparent transition-all group-hover:-translate-y-1 group-hover:shadow-xl ${hoverRing}`}
                >
                  {/* نوار رنگی بالای کارت */}
                  <span className={`absolute inset-x-0 top-0 h-1 ${bar}`} />
                  <CardContent className="space-y-4 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black">{o.teamName}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {o.leadName ?? '—'}
                        </p>
                      </div>
                      {/* حلقه‌ی درصد */}
                      <div className="relative h-14 w-14 shrink-0">
                        <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#eef2f2" strokeWidth="3.5" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            className={ring}
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray={`${(o.progress / 100) * 97.4} 97.4`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-black">
                          <Pct value={o.progress} />
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <AutoStatusBadge status={o.autoStatus} expected={o.expected} />
                      <span className="text-xs text-muted-foreground">{o.krCount} KR</span>
                    </div>

                    <Sparkline data={teamTrend.map((t) => ({ progress: t.progress }))} />

                    <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                      <span className="rounded-lg bg-teal-50 py-1 font-bold text-teal-700">
                        {o.statusCounts.ON_TRACK}
                        <span className="block text-[9px] font-normal">مسیر</span>
                      </span>
                      <span className="rounded-lg bg-amber-50 py-1 font-bold text-amber-700">
                        {o.statusCounts.AT_RISK}
                        <span className="block text-[9px] font-normal">ریسک</span>
                      </span>
                      <span className="rounded-lg bg-red-50 py-1 font-bold text-red-600">
                        {o.statusCounts.BLOCKED}
                        <span className="block text-[9px] font-normal">بلاک</span>
                      </span>
                      <span className="rounded-lg bg-emerald-50 py-1 font-bold text-emerald-600">
                        {o.statusCounts.COMPLETED}
                        <span className="block text-[9px] font-normal">تکمیل</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {/* دو کارت خالی برای تکمیل ردیف آخر (۷ تیم + ۲ = ۹) */}
          {[0, 1].map((i) => (
            <div
              key={`ph-${i}`}
              className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
            >
              —
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
