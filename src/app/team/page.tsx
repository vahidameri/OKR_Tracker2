import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TrendChart } from '@/components/charts/trend-chart';
import { JalaliCalendar } from '@/components/jalali-calendar';
import { TeamSwitcher } from '@/components/team/team-switcher';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { ViewToggle } from '@/components/view-toggle';
import { getSession } from '@/lib/auth';
import { formatJalali } from '@/lib/jalali';
import {
  getTeamOkrs,
  getWeeklyTrend,
  latestValueLabel,
  tkrAutoStatus,
  tkrExpected,
  tkrProgress,
} from '@/lib/okr-data';
import { METRIC_LABELS, weightedProgress } from '@/lib/progress';
import { CommentThread } from '@/components/comment-thread';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { getLeaderboard } from '@/lib/leaderboard';
import { getUserTeams, resolveActiveTeam } from '@/lib/team-access';
import { formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TeamHomePage({
  searchParams,
}: {
  searchParams: { team?: string; view?: string };
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

  const [okrs, trend, leaderboard] = await Promise.all([
    getTeamOkrs(activeTeam.id),
    getWeeklyTrend(activeTeam.id),
    getLeaderboard(),
  ]);
  const allTkrs = okrs.flatMap((o) => o.items);
  const teamProgress = weightedProgress(allTkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) })));
  const view: 'cards' | 'table' = searchParams.view === 'table' ? 'table' : 'cards';

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TeamSwitcher teams={teams} activeTeamId={activeTeam.id} basePath="/team" />
        <ViewToggle
          view={view}
          hrefCards={`/team?team=${activeTeam.id}`}
          hrefTable={`/team?team=${activeTeam.id}&view=table`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-0">
            <CardTitle>روند هفتگی پیشرفت تیم</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle>تقویم</CardTitle>
          </CardHeader>
          <CardContent>
            <JalaliCalendar />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🏆 لیدربورد تیم‌ها (pacing)</CardTitle>
          <CardDescription>
            رتبه‌بندی همه‌ی تیم‌ها بر اساس فاصله از برنامه — فقط برای مشاهده و انگیزه‌ی رقابتی؛ جزئیات OKR
            سایر تیم‌ها نمایش داده نمی‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaderboardTable standings={leaderboard.standings} highlightTeamId={activeTeam.id} />
        </CardContent>
      </Card>

      {okrs.length === 0 && (
        <Card>
          <CardContent className="pt-5 text-center text-muted-foreground">
            هنوز OKRی برای این تیم تعریف نشده است.
          </CardContent>
        </Card>
      )}

      {view === 'table' && okrs.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <THead>
                <TR>
                  <TH>هدف</TH>
                  <TH>نتیجه کلیدی</TH>
                  <TH>نوع</TH>
                  <TH>وزن تیمی</TH>
                  <TH>تارگت</TH>
                  <TH>آخرین مقدار</TH>
                  <TH>پیشرفت</TH>
                  <TH>وضعیت</TH>
                  <TH>آخرین ثبت</TH>
                </TR>
              </THead>
              <TBody>
                {allTkrs.map((tkr) => {
                  const latest = tkr.checkIns[0];
                  const target = tkr.targetValueOverride ?? tkr.keyResult.targetValue;
                  return (
                    <TR key={tkr.id}>
                      <TD className="max-w-40 text-xs">{tkr.keyResult.objective.title}</TD>
                      <TD className="max-w-56">
                        {tkr.keyResult.title}
                        {tkr.keyResult.isShared && <span className="mr-1 text-xs text-violet-600">(مشترک)</span>}
                      </TD>
                      <TD className="text-xs">{METRIC_LABELS[tkr.keyResult.metricType]}</TD>
                      <TD>{tkr.weight}</TD>
                      <TD className="text-xs">
                        {tkr.keyResult.metricType === 'NUMERIC'
                          ? `${formatCompact(target)} ${tkr.keyResult.unit ?? ''}`
                          : '—'}
                      </TD>
                      <TD className="text-xs">{latestValueLabel(tkr)}</TD>
                      <TD className="min-w-[120px]">
                        <ProgressBar value={tkrProgress(tkr)} />
                      </TD>
                      <TD>
                        <div className="flex flex-col gap-1">
                          {latest ? <StatusBadge status={latest.progressStatus} /> : '—'}
                          <AutoStatusBadge status={tkrAutoStatus(tkr)} expected={tkrExpected(tkr)} />
                        </div>
                      </TD>
                      <TD className="text-xs text-muted-foreground">
                        {latest ? formatJalali(latest.weekStartDate) : '—'}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {view === 'cards' &&
        okrs.map(({ objective, items }) => {
          const objectiveProgress = weightedProgress(
            items.map((t) => ({ weight: t.weight, progress: tkrProgress(t) }))
          );
          return (
        <Card key={objective.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-primary/40 bg-primary/5 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {activeTeam.name}
                </span>
                <span className="text-xs text-muted-foreground">{objective.period}</span>
              </div>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-black text-white">
                  {(activeTeam.leadName ?? '؟').trim().charAt(0)}
                </span>
                {activeTeam.leadName ?? '—'}
              </span>
            </div>
            <CardTitle className="text-lg">{objective.title}</CardTitle>
            <ProgressBar value={objectiveProgress} />
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((tkr, idx) => {
              const latest = tkr.checkIns[0];
              const target = tkr.targetValueOverride ?? tkr.keyResult.targetValue;
              const progress = tkrProgress(tkr);
              const expected = tkrExpected(tkr);
              const pace = expected === null ? null : progress - expected;
              return (
                <div key={tkr.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {tkr.keyResult.title}
                        {tkr.keyResult.isShared && (
                          <span className="mr-2 text-xs font-normal text-violet-600">(مشترک — سهم تیم شما)</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {METRIC_LABELS[tkr.keyResult.metricType]} · وزن: {tkr.weight}
                        {tkr.keyResult.metricType === 'NUMERIC' &&
                          ` · تارگت: ${formatCompact(target)} ${tkr.keyResult.unit ?? ''}`}
                        {tkr.keyResult.metricType === 'BOOLEAN' &&
                          tkr.milestones.length > 0 &&
                          ` · مایل‌استون: ${tkr.milestones.filter((m) => m.isDone).length} از ${tkr.milestones.length}`}
                      </p>
                    </div>
                    <div className="w-full sm:w-52">
                      <ProgressBar value={progress} size="sm" />
                      {pace !== null && (
                        <p
                          className={`mt-0.5 text-[11px] font-bold ${pace >= 0 ? 'text-primary' : 'text-amber-700'}`}
                        >
                          {pace >= 0 ? '↑ جلوتر از برنامه' : '↓ عقب از برنامه'} ({pace >= 0 ? '+' : ''}
                          {pace})
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {latest ? (
                        <StatusBadge status={latest.progressStatus} />
                      ) : (
                        <span className="text-xs text-muted-foreground">بدون چک‌این</span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {latest ? `آخرین ثبت: ${formatJalali(latest.weekStartDate)}` : ''}
                      </span>
                    </div>
                    <Link
                      href={`/team/checkin?team=${activeTeam.id}`}
                      className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      ثبت چک‌این
                    </Link>
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
                  {latest?.isEdited && (
                    <p className="mt-2 text-xs text-amber-700">
                      ✎ این چک‌این توسط {latest.editedBy?.fullName ?? 'ادمین'} ویرایش شده است.
                    </p>
                  )}
                  {latest && (
                    <div className="mt-2">
                      <CommentThread
                        checkInId={latest.id}
                        comments={latest.comments.map((cm) => ({
                          id: cm.id,
                          body: cm.body,
                          createdAt: cm.createdAt.toISOString(),
                          authorName: cm.author?.fullName ?? null,
                          authorRole: cm.author?.role ?? null,
                        }))}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
          );
        })}
    </div>
  );
}
