import { AlertTriangle, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/badge';
import { Pct, Signed } from '@/components/ui/pct';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TrendChart } from '@/components/charts/trend-chart';
import { JalaliCalendar } from '@/components/jalali-calendar';
import { TeamSwitcher } from '@/components/team/team-switcher';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { OkrToolbar } from '@/components/okr-toolbar';
import { CheckinModalButton } from '@/components/team/checkin-modal';
import { getSession } from '@/lib/auth';
import { formatJalali, getWeekStart } from '@/lib/jalali';
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
  searchParams: { team?: string; view?: string; q?: string; status?: string };
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

  const [allOkrs, trend, leaderboard] = await Promise.all([
    getTeamOkrs(activeTeam.id),
    getWeeklyTrend(activeTeam.id),
    getLeaderboard(),
  ]);
  const allTkrs = allOkrs.flatMap((o) => o.items);
  const teamProgress = weightedProgress(allTkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) })));
  const view: 'cards' | 'table' = searchParams.view === 'table' ? 'table' : 'cards';

  // اعمال فیلتر جستجو و وضعیت (پیشرفت وزنی تیم از کل داده محاسبه می‌شود، نه فیلترشده)
  const q = (searchParams.q ?? '').trim().toLowerCase();
  const statusFilter = searchParams.status ?? '';
  const matchTkr = (tkr: (typeof allTkrs)[number], objTitle: string) => {
    if (q && !`${tkr.keyResult.title} ${objTitle}`.toLowerCase().includes(q)) return false;
    if (statusFilter) {
      const latest = tkr.checkIns[0];
      if (statusFilter === 'NONE') return !latest;
      if (!latest || latest.progressStatus !== statusFilter) return false;
    }
    return true;
  };
  const okrs = allOkrs
    .map(({ objective, items }) => ({ objective, items: items.filter((t) => matchTkr(t, objective.title)) }))
    .filter((o) => o.items.length > 0);

  // ابزار مدیریت تیم (لید): پیگیری چک‌این این هفته + بلاکرهای فعال + شمارش وضعیت‌ها
  const weekStartIso = getWeekStart().toISOString();
  const pendingKrs = allTkrs.filter(
    (t) => !t.checkIns.some((c) => c.weekStartDate.toISOString() === weekStartIso)
  );
  const doneThisWeek = allTkrs.length - pendingKrs.length;
  const coverage = allTkrs.length ? Math.round((doneThisWeek / allTkrs.length) * 100) : 0;
  const activeBlockers = allTkrs
    .filter((t) => t.checkIns[0]?.progressStatus === 'BLOCKED')
    .map((t) => ({
      id: t.id,
      title: t.keyResult.title,
      blocker: t.checkIns[0]?.blockerDescription ?? null,
    }));
  const statusTally = allTkrs.reduce(
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">OKRهای تیم {activeTeam.name}</h1>
          <p className="text-sm text-muted-foreground">
            مسئول تیم: {activeTeam.leadName ?? '—'} · پیشرفت وزنی: <b><Pct value={teamProgress} /></b>
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

      {/* ابزار مدیریت تیم (لید) */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-black text-muted-foreground">
          <ClipboardCheck className="h-4 w-4" /> ابزار مدیریت تیم
        </h2>

        {/* شمارش وضعیت‌ها */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'در مسیر', value: statusTally.onTrack, cls: 'bg-emerald-50 text-emerald-700' },
            { label: 'در ریسک', value: statusTally.atRisk, cls: 'bg-amber-50 text-amber-700' },
            { label: 'بلاک‌شده', value: statusTally.blocked, cls: 'bg-red-50 text-red-600' },
            { label: 'تکمیل‌شده', value: statusTally.completed, cls: 'bg-blue-50 text-blue-600' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.cls}`}>
              <p className="text-2xl font-black tabular-nums">{s.value}</p>
              <p className="mt-0.5 text-[11px] font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* پیگیری چک‌این این هفته */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>چک‌این این هفته</span>
                <span className="text-sm font-black text-primary">{coverage}٪</span>
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
                      <span
                        key={t.id}
                        className="max-w-full truncate rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-800"
                        title={t.keyResult.title}
                      >
                        {t.keyResult.title}
                      </span>
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

          {/* بلاکرهای فعال */}
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
      </section>

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

      {/* نوار ابزار: کارتی/جدولی + فیلتر وضعیت + جستجو */}
      <OkrToolbar view={view} />

      {okrs.length === 0 && (
        <Card>
          <CardContent className="pt-5 text-center text-muted-foreground">
            {allOkrs.length === 0
              ? 'هنوز OKRی برای این تیم تعریف نشده است.'
              : 'موردی با این فیلتر پیدا نشد.'}
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
                {okrs.flatMap((o) => o.items).map((tkr) => {
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
              const weekStartIso = getWeekStart().toISOString();
              const thisWeekCheckIn =
                tkr.checkIns.find((c) => c.weekStartDate.toISOString() === weekStartIso) ?? null;
              const target = tkr.targetValueOverride ?? tkr.keyResult.targetValue;
              const progress = tkrProgress(tkr);
              const expected = tkrExpected(tkr);
              const pace = expected === null ? null : progress - expected;
              return (
                <div
                  key={tkr.id}
                  className={cn(
                    'rounded-lg border p-3 transition-colors',
                    thisWeekCheckIn ? 'border-emerald-200 bg-emerald-50/40' : 'border-border bg-card'
                  )}
                >
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
                        {latest && ` · آخرین ثبت: ${formatJalali(latest.weekStartDate)}`}
                      </p>
                    </div>
                    <div className="w-full sm:w-52">
                      <ProgressBar value={progress} size="sm" />
                      {pace !== null && (
                        <p
                          className={`mt-0.5 flex items-center gap-1 text-[11px] font-bold ${pace >= 0 ? 'text-primary' : 'text-amber-700'}`}
                        >
                          {pace >= 0 ? '↑ جلوتر از برنامه' : '↓ عقب از برنامه'}
                          <span className="text-muted-foreground">
                            (<Signed value={pace} />)
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {latest ? (
                        <StatusBadge status={latest.progressStatus} />
                      ) : (
                        <span className="text-xs text-muted-foreground">بدون چک‌این</span>
                      )}
                    </div>
                    <CheckinModalButton
                      teamKeyResultId={tkr.id}
                      metricType={tkr.keyResult.metricType}
                      unit={tkr.keyResult.unit}
                      krTitle={tkr.keyResult.title}
                      objectiveTitle={objective.title}
                      tasks={tkr.tasks.map((t) => ({ id: t.id, title: t.title, isDone: t.isDone }))}
                      existing={
                        thisWeekCheckIn
                          ? {
                              currentValue: thisWeekCheckIn.currentValue,
                              booleanValue: thisWeekCheckIn.booleanValue,
                              textValue: thisWeekCheckIn.textValue,
                              progressStatus: thisWeekCheckIn.progressStatus,
                              blockerDescription: thisWeekCheckIn.blockerDescription,
                            }
                          : null
                      }
                    />
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
