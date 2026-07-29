import { AlertTriangle, ArrowLeft, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Pct } from '@/components/ui/pct';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TrendChart } from '@/components/charts/trend-chart';
import { JalaliCalendar } from '@/components/jalali-calendar';
import { CycleTimeBar } from '@/components/cycle-time-bar';
import { TeamSwitcher } from '@/components/team/team-switcher';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { getSession } from '@/lib/auth';
import { getWeekStart } from '@/lib/jalali';
import { getTeamOkrs, getWeeklyTrend, tkrProgress } from '@/lib/okr-data';
import { weightedProgress } from '@/lib/progress';
import { getLeaderboard } from '@/lib/leaderboard';
import { getUserTeams, resolveActiveTeam } from '@/lib/team-access';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** داشبورد تیم — نمای کلی: پیشرفت، وضعیت‌ها، روند، تایم‌لاین دوره، لیدربورد */
export default async function TeamDashboardPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const teams = await getUserTeams(session.user.id, session.user.role);
  const activeTeam = resolveActiveTeam(teams, searchParams.team);

  if (!activeTeam) {
    return (
      <Card>
        <CardContent className="pt-5 text-center text-muted-foreground">
          هنوز به هیچ تیمی متصل نشده‌اید. با مدیر برنامه (PgM) تماس بگیرید.
        </CardContent>
      </Card>
    );
  }

  const [allOkrs, trend, leaderboard, activeCycles] = await Promise.all([
    getTeamOkrs(activeTeam.id),
    getWeeklyTrend(activeTeam.id),
    getLeaderboard(),
    prisma.cycle.findMany({ where: { isActive: true }, orderBy: { startDate: 'desc' } }),
  ]);
  const allTkrs = allOkrs.flatMap((o) => o.items);
  const teamProgress = weightedProgress(allTkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) })));

  const now = new Date();
  const currentCycle =
    activeCycles.find((c) => c.startDate <= now && c.endDate >= now) ?? activeCycles[0] ?? null;

  // شمارش وضعیت‌ها + پیگیری چک‌این این هفته + بلاکرهای فعال
  const weekStartIso = getWeekStart().toISOString();
  const pendingKrs = allTkrs.filter(
    (t) => !t.checkIns.some((c) => c.weekStartDate.toISOString() === weekStartIso)
  );
  const doneThisWeek = allTkrs.length - pendingKrs.length;
  const coverage = allTkrs.length ? Math.round((doneThisWeek / allTkrs.length) * 100) : 0;
  const activeBlockers = allTkrs
    .filter((t) => t.checkIns[0]?.progressStatus === 'BLOCKED')
    .map((t) => ({ id: t.id, title: t.keyResult.title, blocker: t.checkIns[0]?.blockerDescription ?? null }));
  const tally = allTkrs.reduce(
    (acc, t) => {
      const s = t.checkIns[0]?.progressStatus;
      if (s === 'ON_TRACK') acc.onTrack += 1;
      else if (s === 'AT_RISK') acc.atRisk += 1;
      else if (s === 'BLOCKED') acc.blocked += 1;
      else if (s === 'COMPLETED') acc.completed += 1;
      return acc;
    },
    { onTrack: 0, atRisk: 0, blocked: 0, completed: 0 }
  );

  const tiles = [
    { key: 'ON_TRACK', label: 'در مسیر', value: tally.onTrack, cls: 'bg-teal-50 text-teal-700', bar: 'bg-teal-500' },
    { key: 'AT_RISK', label: 'در ریسک', value: tally.atRisk, cls: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500' },
    { key: 'BLOCKED', label: 'بلاک‌شده', value: tally.blocked, cls: 'bg-red-50 text-red-600', bar: 'bg-red-500' },
    { key: 'COMPLETED', label: 'تکمیل‌شده', value: tally.completed, cls: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">داشبورد تیم {activeTeam.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">مسئول تیم: {activeTeam.leadName ?? '—'}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/team/okrs?team=${activeTeam.id}`}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold transition-colors hover:bg-muted"
          >
            OKRهای من
          </Link>
          <Link
            href={`/team/checkin?team=${activeTeam.id}`}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            ثبت وضعیت این هفته
          </Link>
        </div>
      </div>

      <TeamSwitcher teams={teams} activeTeamId={activeTeam.id} basePath="/team" />

      {/* کارت‌های وضعیت — همه در یک ردیف (۵ کارت) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Link
          href={`/team/okrs?team=${activeTeam.id}`}
          className="group rounded-2xl bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent p-4 ring-1 ring-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-3xl font-black text-primary"><Pct value={teamProgress} /></p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">پیشرفت وزنی تیم</p>
        </Link>
        {tiles.map((t) => (
          <Link
            key={t.key}
            href={`/team/okrs?team=${activeTeam.id}&status=${t.key}`}
            className={`group relative overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${t.cls}`}
          >
            <span className={`absolute inset-y-0 right-0 w-1 ${t.bar}`} />
            <p className="text-3xl font-black tabular-nums">{t.value}</p>
            <p className="mt-1 text-xs font-bold">{t.label}</p>
          </Link>
        ))}
      </div>

      {/* روند + تقویم با تایم‌لاین دوره */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-0">
            <CardTitle>روند هفتگی پیشرفت تیم</CardTitle>
            <CardDescription>پیشرفت وزنی تیم هفته‌به‌هفته</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle>تقویم و زمان دوره</CardTitle>
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

      {/* پیگیری چک‌این این هفته + بلاکرهای فعال */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" /> چک‌این این هفته
            </CardTitle>
            <CardDescription>
              {doneThisWeek} از {allTkrs.length} نتیجه کلیدی این هفته ثبت شده است.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgressBar value={coverage} />
            {pendingKrs.length > 0 ? (
              <div>
                <p className="mb-1.5 text-xs font-bold text-amber-700">
                  {pendingKrs.length} مورد باقی‌مانده — نیازمند ثبت:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pendingKrs.slice(0, 8).map((t) => (
                    <Link
                      key={t.id}
                      href={`/team/checkin?team=${activeTeam.id}#kr-${t.id}`}
                      className="max-w-full truncate rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-800 hover:bg-amber-100"
                      title={`ثبت چک‌این: ${t.keyResult.title}`}
                    >
                      {t.keyResult.title}
                    </Link>
                  ))}
                  {pendingKrs.length > 8 && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                      +{pendingKrs.length - 8} مورد دیگر
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-emerald-700">✓ همه‌ی موارد این هفته ثبت شده‌اند.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" /> بلاکرهای فعال
            </CardTitle>
            <CardDescription>نتایج کلیدی‌ای که آخرین وضعیتشان «بلاک‌شده» است.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeBlockers.length > 0 ? (
              <ul className="space-y-2">
                {activeBlockers.map((b) => (
                  <li key={b.id} className="rounded-lg border border-red-100 bg-red-50/60 p-2.5 text-sm">
                    <p className="font-bold text-red-800">{b.title}</p>
                    {b.blocker && <p className="mt-0.5 text-justify text-xs text-red-700">{b.blocker}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-xs font-bold text-emerald-700">✓ هیچ بلاکر فعالی وجود ندارد.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* لیدربورد */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 لیدربورد تیم‌ها</CardTitle>
          <CardDescription>
            رتبه‌بندی همه‌ی تیم‌ها بر اساس فاصله از برنامه — فقط برای مشاهده و انگیزه‌ی رقابتی.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaderboardTable standings={leaderboard.standings} highlightTeamId={activeTeam.id} />
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Link
          href={`/team/okrs?team=${activeTeam.id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
        >
          مشاهده و ثبت همه‌ی OKRهای تیم <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
