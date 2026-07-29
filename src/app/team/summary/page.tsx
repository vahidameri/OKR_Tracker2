import { redirect } from 'next/navigation';
import { AutoStatusBadge } from '@/components/ui/badge';
import { Pct } from '@/components/ui/pct';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TeamSwitcher } from '@/components/team/team-switcher';
import { getSession } from '@/lib/auth';
import { getWeekStart } from '@/lib/jalali';
import { getTeamOkrs, tkrAutoStatus, tkrExpected, tkrProgress } from '@/lib/okr-data';
import { weightedProgress } from '@/lib/progress';
import { getUserTeams, resolveActiveTeam } from '@/lib/team-access';

export const dynamic = 'force-dynamic';

/** خلاصه وضعیت تیم — نمای فشرده‌ی سلامت اهداف، چک‌این‌های مانده و بلاکرها */
export default async function TeamSummaryPage({
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

  const allOkrs = await getTeamOkrs(activeTeam.id);
  const allTkrs = allOkrs.flatMap((o) => o.items);
  const teamProgress = weightedProgress(allTkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) })));

  const weekStartIso = getWeekStart().toISOString();
  const pendingKrs = allTkrs.filter(
    (t) => !t.checkIns.some((c) => c.weekStartDate.toISOString() === weekStartIso)
  );
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

  const kpis = [
    { label: 'پیشرفت وزنی', node: <Pct value={teamProgress} />, cls: 'text-primary' },
    { label: 'در مسیر', node: tally.onTrack, cls: 'text-teal-700' },
    { label: 'در ریسک', node: tally.atRisk, cls: 'text-amber-700' },
    { label: 'بلاک‌شده', node: tally.blocked, cls: 'text-red-600' },
    { label: 'تکمیل‌شده', node: tally.completed, cls: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">خلاصه وضعیت تیم {activeTeam.name}</h1>
        <p className="text-sm text-muted-foreground">نمای فشرده‌ی سلامت اهداف، چک‌این‌های مانده و بلاکرها</p>
      </div>

      <TeamSwitcher teams={teams} activeTeamId={activeTeam.id} basePath="/team/summary" />

      {/* KPIها */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-5 text-center">
              <p className={`text-3xl font-black tabular-nums ${k.cls}`}>{k.node}</p>
              <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* پیشرفت هر هدف */}
      <Card>
        <CardHeader>
          <CardTitle>پیشرفت اهداف</CardTitle>
          <CardDescription>پیشرفت وزنی هر هدف و وضعیت زمانی نتایج کلیدی آن</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allOkrs.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">هنوز OKRی برای این تیم تعریف نشده است.</p>
          )}
          {allOkrs.map(({ objective, items }) => {
            const p = weightedProgress(items.map((t) => ({ weight: t.weight, progress: tkrProgress(t) })));
            return (
              <div key={objective.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{objective.title}</p>
                  <span className="text-xs text-muted-foreground">{items.length} نتیجه کلیدی · {objective.period}</span>
                </div>
                <ProgressBar value={p} />
                <div className="flex flex-wrap gap-2 pr-1">
                  {items.map((t) => (
                    <span key={t.id} className="inline-flex items-center gap-1.5 text-xs">
                      <span className="max-w-40 truncate text-muted-foreground" title={t.keyResult.title}>
                        {t.keyResult.title}
                      </span>
                      <AutoStatusBadge status={tkrAutoStatus(t)} expected={tkrExpected(t)} />
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* چک‌این‌های مانده + بلاکرها */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>چک‌این‌های مانده‌ی این هفته</CardTitle>
            <CardDescription>{pendingKrs.length} نتیجه کلیدی هنوز ثبت نشده است.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingKrs.length === 0 ? (
              <p className="py-3 text-center text-xs font-bold text-emerald-700">✓ همه‌ی موارد این هفته ثبت شده‌اند.</p>
            ) : (
              <ul className="space-y-1.5">
                {pendingKrs.map((t) => (
                  <li key={t.id} className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-900">
                    {t.keyResult.title}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>بلاکرهای فعال</CardTitle>
            <CardDescription>{activeBlockers.length} نتیجه کلیدی «بلاک‌شده» است.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeBlockers.length === 0 ? (
              <p className="py-3 text-center text-xs font-bold text-emerald-700">✓ هیچ بلاکر فعالی وجود ندارد.</p>
            ) : (
              <ul className="space-y-2">
                {activeBlockers.map((b) => (
                  <li key={b.id} className="rounded-lg border border-red-100 bg-red-50/60 p-2.5 text-sm">
                    <p className="font-bold text-red-800">{b.title}</p>
                    {b.blocker && <p className="mt-0.5 text-justify text-xs text-red-700">{b.blocker}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
