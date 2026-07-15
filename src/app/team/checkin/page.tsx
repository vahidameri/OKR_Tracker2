import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckInForm } from '@/components/team/checkin-form';
import { CheckinTable, type CheckinTableRow } from '@/components/team/checkin-table';
import { TeamSwitcher } from '@/components/team/team-switcher';
import { ViewToggle } from '@/components/view-toggle';
import { getSession } from '@/lib/auth';
import { formatJalali, getWeekStart } from '@/lib/jalali';
import { getTeamOkrs } from '@/lib/okr-data';
import { METRIC_LABELS } from '@/lib/progress';
import { getUserTeams, resolveActiveTeam } from '@/lib/team-access';
import { formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CheckInPage({
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

  const okrs = await getTeamOkrs(activeTeam.id);
  const weekStart = getWeekStart();
  const weekStartIso = weekStart.toISOString();
  const view: 'cards' | 'table' = searchParams.view === 'table' ? 'table' : 'cards';

  const tableRows: CheckinTableRow[] = okrs.flatMap(({ objective, items }) =>
    items.map((tkr) => {
      const thisWeek = tkr.checkIns.find((c) => c.weekStartDate.toISOString() === weekStartIso) ?? null;
      return {
        teamKeyResultId: tkr.id,
        objectiveTitle: objective.title,
        krTitle: tkr.keyResult.title,
        isShared: tkr.keyResult.isShared,
        metricType: tkr.keyResult.metricType,
        unit: tkr.keyResult.unit,
        weight: tkr.weight,
        target: tkr.targetValueOverride ?? tkr.keyResult.targetValue,
        existing: thisWeek
          ? {
              currentValue: thisWeek.currentValue,
              booleanValue: thisWeek.booleanValue,
              textValue: thisWeek.textValue,
              progressStatus: thisWeek.progressStatus,
              blockerDescription: thisWeek.blockerDescription,
            }
          : null,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">ثبت وضعیت هفتگی — تیم {activeTeam.name}</h1>
        <p className="text-sm text-muted-foreground">
          هفته‌ی شروع‌شده از شنبه {formatJalali(weekStart)} · ثبت مجدد در همان هفته، مقدار قبلی را به‌روزرسانی می‌کند.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TeamSwitcher teams={teams} activeTeamId={activeTeam.id} basePath="/team/checkin" />
        <ViewToggle
          view={view}
          hrefCards={`/team/checkin?team=${activeTeam.id}`}
          hrefTable={`/team/checkin?team=${activeTeam.id}&view=table`}
        />
      </div>

      {view === 'table' && okrs.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <CheckinTable rows={tableRows} />
          </CardContent>
        </Card>
      )}

      {okrs.length === 0 && (
        <Card>
          <CardContent className="pt-5 text-center text-muted-foreground">
            OKRی برای این تیم تعریف نشده است.
          </CardContent>
        </Card>
      )}

      {view === 'cards' &&
        okrs.map(({ objective, items }) => (
        <Card key={objective.id}>
          <CardHeader>
            <CardTitle>{objective.title}</CardTitle>
            <CardDescription>دوره: {objective.period}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((tkr) => {
              const thisWeek = tkr.checkIns.find((c) => c.weekStartDate.toISOString() === weekStartIso) ?? null;
              const target = tkr.targetValueOverride ?? tkr.keyResult.targetValue;
              return (
                <div key={tkr.id} className="rounded-lg border border-border p-4">
                  <div className="mb-3">
                    <p className="font-medium">
                      {tkr.keyResult.title}
                      {tkr.keyResult.isShared && (
                        <span className="mr-2 text-xs text-violet-600">(مشترک — فقط سهم تیم شما ثبت می‌شود)</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {METRIC_LABELS[tkr.keyResult.metricType]} · وزن تیمی: {tkr.weight}
                      {tkr.keyResult.metricType === 'NUMERIC' &&
                        ` · تارگت تیم شما: ${formatCompact(target)} ${tkr.keyResult.unit ?? ''}`}
                    </p>
                  </div>
                  <CheckInForm
                    teamKeyResultId={tkr.id}
                    metricType={tkr.keyResult.metricType}
                    unit={tkr.keyResult.unit}
                    existing={
                      thisWeek
                        ? {
                            currentValue: thisWeek.currentValue,
                            booleanValue: thisWeek.booleanValue,
                            textValue: thisWeek.textValue,
                            progressStatus: thisWeek.progressStatus,
                            blockerDescription: thisWeek.blockerDescription,
                          }
                        : null
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
