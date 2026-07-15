import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TrendChart } from '@/components/charts/trend-chart';
import { TeamSwitcher } from '@/components/team/team-switcher';
import { getSession } from '@/lib/auth';
import { formatJalali } from '@/lib/jalali';
import { getTeamOkrs, getWeeklyTrend, tkrProgress } from '@/lib/okr-data';
import { METRIC_LABELS, weightedProgress } from '@/lib/progress';
import { getUserTeams, resolveActiveTeam } from '@/lib/team-access';
import { formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TeamHomePage({ searchParams }: { searchParams: { team?: string } }) {
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

  const [okrs, trend] = await Promise.all([getTeamOkrs(activeTeam.id), getWeeklyTrend(activeTeam.id)]);
  const allTkrs = okrs.flatMap((o) => o.items);
  const teamProgress = weightedProgress(allTkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) })));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">OKRهای تیم {activeTeam.name}</h1>
          <p className="text-sm text-muted-foreground">
            مسئول تیم: {activeTeam.leadName ?? '—'} · پیشرفت وزنی: <b>{teamProgress}٪</b>
          </p>
        </div>
        <Link
          href={`/team/checkin?team=${activeTeam.id}`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          ثبت وضعیت این هفته
        </Link>
      </div>

      <TeamSwitcher teams={teams} activeTeamId={activeTeam.id} basePath="/team" />

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>روند هفتگی پیشرفت تیم</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={trend} />
        </CardContent>
      </Card>

      {okrs.length === 0 && (
        <Card>
          <CardContent className="pt-5 text-center text-muted-foreground">
            هنوز OKRی برای این تیم تعریف نشده است.
          </CardContent>
        </Card>
      )}

      {okrs.map(({ objective, items }) => (
        <Card key={objective.id}>
          <CardHeader>
            <CardTitle>{objective.title}</CardTitle>
            <CardDescription>دوره: {objective.period}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((tkr) => {
              const latest = tkr.checkIns[0];
              const target = tkr.targetValueOverride ?? tkr.keyResult.targetValue;
              return (
                <div key={tkr.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {tkr.keyResult.title}
                        {tkr.keyResult.isShared && (
                          <span className="mr-2 text-xs text-violet-600">(مشترک — سهم تیم شما)</span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {METRIC_LABELS[tkr.keyResult.metricType]} · وزن تیمی: {tkr.weight}
                        {tkr.keyResult.metricType === 'NUMERIC' &&
                          ` · تارگت: ${formatCompact(target)} ${tkr.keyResult.unit ?? ''}`}
                      </p>
                      {tkr.keyResult.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{tkr.keyResult.description}</p>
                      )}
                    </div>
                    <div className="text-left">
                      {latest ? <StatusBadge status={latest.progressStatus} /> : <span className="text-xs text-muted-foreground">بدون چک‌این</span>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {latest ? `آخرین ثبت: ${formatJalali(latest.weekStartDate)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={tkrProgress(tkr)} />
                  </div>
                  {latest?.feedback && (latest.feedback.score !== null || latest.feedback.comment) && (
                    <div className="mt-2 rounded-md bg-blue-50 p-2 text-xs text-blue-900">
                      بازخورد ادمین:
                      {latest.feedback.score !== null && <b> امتیاز {latest.feedback.score}/10 · </b>}
                      {latest.feedback.comment}
                    </div>
                  )}
                  {latest?.blockerDescription && (
                    <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800">
                      بلاکر: {latest.blockerDescription}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
