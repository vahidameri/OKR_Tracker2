import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/badge';
import { Signed } from '@/components/ui/pct';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TeamSwitcher } from '@/components/team/team-switcher';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { OkrToolbar } from '@/components/okr-toolbar';
import { CheckinModalButton } from '@/components/team/checkin-modal';
import { CommentThread } from '@/components/comment-thread';
import { getSession } from '@/lib/auth';
import { formatJalali, getWeekStart } from '@/lib/jalali';
import {
  getTeamOkrs,
  latestValueLabel,
  tkrAutoStatus,
  tkrExpected,
  tkrProgress,
} from '@/lib/okr-data';
import { METRIC_LABELS, weightedProgress } from '@/lib/progress';
import { getUserTeams, resolveActiveTeam } from '@/lib/team-access';
import { cn, formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** OKRهای من — فهرست کامل نتایج کلیدی تیم با ثبت/ویرایش چک‌این و گفتگو */
export default async function TeamOkrsPage({
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

  const allOkrs = await getTeamOkrs(activeTeam.id);
  const view: 'cards' | 'table' = searchParams.view === 'table' ? 'table' : 'cards';

  const q = (searchParams.q ?? '').trim().toLowerCase();
  const statusFilter = searchParams.status ?? '';
  const matchTkr = (tkr: (typeof allOkrs)[number]['items'][number], objTitle: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">OKRهای تیم {activeTeam.name}</h1>
          <p className="text-sm text-muted-foreground">همه‌ی نتایج کلیدی تیم شما — ثبت و پیگیری هفتگی</p>
        </div>
        <Link
          href={`/team/checkin?team=${activeTeam.id}`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          ثبت وضعیت این هفته
        </Link>
      </div>

      <TeamSwitcher teams={teams} activeTeamId={activeTeam.id} basePath="/team/okrs" />

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
                          : tkr.keyResult.metricType === 'BOOLEAN'
                            ? tkr.keyResult.targetBoolean === false
                              ? 'خیر'
                              : 'بله'
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
                            {tkr.keyResult.metricType === 'BOOLEAN' &&
                              ` · تارگت: ${tkr.keyResult.targetBoolean === false ? 'خیر' : 'بله'}`}
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
                      {latest?.blockerDescription && (
                        <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800">
                          بلاکر: {latest.blockerDescription}
                        </div>
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
