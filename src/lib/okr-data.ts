import { ProgressStatus } from '@prisma/client';
import { weekLabel } from '@/lib/jalali';
import { expectedProgressForPeriod } from '@/lib/period';
import { prisma } from '@/lib/prisma';
import { checkInProgress, computeAutoStatus, weightedProgress, type AutoStatus } from '@/lib/progress';
import { formatCompact } from '@/lib/utils';

const tkrInclude = {
  team: true,
  keyResult: { include: { objective: true } },
  milestones: { orderBy: { order: 'asc' as const } },
  checkIns: {
    orderBy: { weekStartDate: 'desc' as const },
    include: { feedback: true, submittedBy: { select: { fullName: true } } },
  },
};

export type TkrWithData = Awaited<ReturnType<typeof fetchAllTkrs>>[number];

export function fetchAllTkrs(teamId?: string) {
  return prisma.teamKeyResult.findMany({
    where: teamId ? { teamId } : undefined,
    include: tkrInclude,
    orderBy: [{ keyResult: { objective: { createdAt: 'asc' } } }, { id: 'asc' }],
  });
}

export function tkrProgress(tkr: TkrWithData): number {
  return checkInProgress(tkr, tkr.checkIns[0] ?? null);
}

/** پیشرفت مورد انتظار این KR-تیم بر اساس زمان سپری‌شده از دوره‌ی هدفش */
export function tkrExpected(tkr: TkrWithData): number | null {
  return expectedProgressForPeriod(tkr.keyResult.objective.period);
}

/** وضعیت خودکار زمانی این KR-تیم (بدون قضاوت دستی) */
export function tkrAutoStatus(tkr: TkrWithData): AutoStatus | null {
  return computeAutoStatus(tkrProgress(tkr), tkrExpected(tkr));
}

/** میانگین وزنی «پیشرفت مورد انتظار» مجموعه‌ای از KR-تیم‌ها (دوره‌های ناشناخته حذف می‌شوند) */
export function expectedOf(tkrs: TkrWithData[]): number | null {
  const items = tkrs
    .map((t) => ({ weight: t.weight, expected: tkrExpected(t) }))
    .filter((i): i is { weight: number; expected: number } => i.expected !== null);
  if (items.length === 0) return null;
  return weightedProgress(items.map((i) => ({ weight: i.weight, progress: i.expected })));
}

/** برچسب متنی آخرین مقدار ثبت‌شده‌ی یک KR-تیم (با پشتیبانی مایل‌استون) */
export function latestValueLabel(tkr: TkrWithData): string {
  const latest = tkr.checkIns[0];
  const kr = tkr.keyResult;
  if (!latest) return '—';
  if (kr.metricType === 'NUMERIC') {
    return `${formatCompact(latest.currentValue)} ${kr.unit ?? ''}`.trim();
  }
  if (kr.metricType === 'BOOLEAN') {
    if (tkr.milestones.length > 0 && latest.currentValue !== null) {
      return `${latest.currentValue} از ${tkr.milestones.length} مایل‌استون`;
    }
    return latest.booleanValue ? 'بله' : 'خیر';
  }
  return latest.textValue ?? '—';
}

export interface TeamOverview {
  teamId: string;
  teamName: string;
  leadName: string | null;
  progress: number;
  expected: number | null;
  autoStatus: AutoStatus | null;
  krCount: number;
  statusCounts: Record<ProgressStatus, number>;
  lastCheckInAt: Date | null;
}

type TeamRow = { id: string; name: string; leadName: string | null };

/** نمای کلی تیم‌ها از داده‌ی از قبل واکشی‌شده (بدون کوئری اضافه) */
export function computeOverviews(teams: TeamRow[], tkrs: TkrWithData[]): TeamOverview[] {
  return teams.map((team) => {
    const teamTkrs = tkrs.filter((t) => t.teamId === team.id);
    const statusCounts: Record<ProgressStatus, number> = {
      ON_TRACK: 0,
      AT_RISK: 0,
      BLOCKED: 0,
      COMPLETED: 0,
    };
    let lastCheckInAt: Date | null = null;
    for (const tkr of teamTkrs) {
      const latest = tkr.checkIns[0];
      if (latest) {
        statusCounts[latest.progressStatus] += 1;
        if (!lastCheckInAt || latest.submittedAt > lastCheckInAt) lastCheckInAt = latest.submittedAt;
      }
    }
    const progress = weightedProgress(teamTkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) })));
    const expected = expectedOf(teamTkrs);
    return {
      teamId: team.id,
      teamName: team.name,
      leadName: team.leadName,
      progress,
      expected,
      autoStatus: teamTkrs.length > 0 ? computeAutoStatus(progress, expected) : null,
      krCount: teamTkrs.length,
      statusCounts,
      lastCheckInAt,
    };
  });
}

/** نمای کلی همه‌ی تیم‌ها + پیشرفت وزنی کل دپارتمان (+ داده‌ی خام برای محاسبات بیشتر) */
export async function getDepartmentOverview() {
  const [teams, tkrs] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
    fetchAllTkrs(),
  ]);

  const overviews = computeOverviews(teams, tkrs);

  // پیشرفت دپارتمان: میانگین وزنی روی تمام رکوردهای TeamKeyResult (نه وزن ثابت روی KR)
  const departmentProgress = weightedProgress(
    tkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) }))
  );

  return { overviews, departmentProgress, totalTkrs: tkrs.length, teams, tkrs };
}

/** روند هفتگی از داده‌ی از قبل واکشی‌شده */
export function computeTrend(tkrs: TkrWithData[]): TrendPoint[] {
  const weekSet = new Set<string>();
  for (const tkr of tkrs) {
    for (const c of tkr.checkIns) weekSet.add(c.weekStartDate.toISOString());
  }
  const weeks = Array.from(weekSet).sort();

  return weeks.map((weekIso) => {
    const items = tkrs.map((tkr) => {
      const upTo = tkr.checkIns.find((c) => c.weekStartDate.toISOString() <= weekIso);
      return { weight: tkr.weight, progress: checkInProgress(tkr, upTo ?? null) };
    });
    return {
      week: weekLabel(new Date(weekIso)),
      weekDate: weekIso,
      progress: weightedProgress(items),
    };
  });
}

export interface ObjectiveProgress {
  id: string;
  title: string;
  period: string;
  weight: number;
  krCount: number;
  progress: number;
  expected: number | null;
  autoStatus: AutoStatus | null;
}

/** پیشرفت وزنی هر هدف (تجمیع همه‌ی سهم‌های تیمی KRهایش) */
export function computeObjectiveProgress(tkrs: TkrWithData[]): ObjectiveProgress[] {
  const byObjective = new Map<string, { obj: TkrWithData['keyResult']['objective']; items: TkrWithData[] }>();
  for (const tkr of tkrs) {
    const obj = tkr.keyResult.objective;
    if (!byObjective.has(obj.id)) byObjective.set(obj.id, { obj, items: [] });
    byObjective.get(obj.id)!.items.push(tkr);
  }
  return Array.from(byObjective.values()).map(({ obj, items }) => {
    const progress = weightedProgress(items.map((t) => ({ weight: t.weight, progress: tkrProgress(t) })));
    const expected = expectedProgressForPeriod(obj.period);
    return {
      id: obj.id,
      title: obj.title,
      period: obj.period,
      weight: obj.weight,
      krCount: new Set(items.map((i) => i.keyResultId)).size,
      progress,
      expected,
      autoStatus: computeAutoStatus(progress, expected),
    };
  });
}

export interface ComplianceCell {
  weekIso: string;
  submitted: number;
  total: number;
  ratio: number;
}

export interface ComplianceRow {
  teamId: string;
  teamName: string;
  cells: ComplianceCell[];
}

/** ماتریس نظم ثبت چک‌این: هر تیم × هر هفته، چند KR از کل ثبت شده */
export function computeCompliance(teams: TeamRow[], tkrs: TkrWithData[]) {
  const weekSet = new Set<string>();
  for (const tkr of tkrs) {
    for (const c of tkr.checkIns) weekSet.add(c.weekStartDate.toISOString());
  }
  const weeks = Array.from(weekSet).sort().slice(-10); // ۱۰ هفته‌ی اخیر

  const rows: ComplianceRow[] = teams.map((team) => {
    const teamTkrs = tkrs.filter((t) => t.teamId === team.id);
    return {
      teamId: team.id,
      teamName: team.name,
      cells: weeks.map((weekIso) => {
        const submitted = teamTkrs.filter((t) =>
          t.checkIns.some((c) => c.weekStartDate.toISOString() === weekIso)
        ).length;
        return {
          weekIso,
          submitted,
          total: teamTkrs.length,
          ratio: teamTkrs.length === 0 ? 0 : submitted / teamTkrs.length,
        };
      }),
    };
  });

  return { weeks, rows };
}

export interface TrendPoint {
  week: string;
  weekDate: string;
  progress: number;
}

/** روند هفتگی پیشرفت وزنی (کل دپارتمان یا یک تیم) */
export async function getWeeklyTrend(teamId?: string): Promise<TrendPoint[]> {
  const tkrs = await fetchAllTkrs(teamId);
  return computeTrend(tkrs);
}

/** OKRهای یک تیم به تفکیک هدف، برای پنل تیم و drill-down ادمین */
export async function getTeamOkrs(teamId: string) {
  const tkrs = await fetchAllTkrs(teamId);
  const byObjective = new Map<
    string,
    { objective: TkrWithData['keyResult']['objective']; items: TkrWithData[] }
  >();
  for (const tkr of tkrs) {
    const obj = tkr.keyResult.objective;
    if (!byObjective.has(obj.id)) byObjective.set(obj.id, { objective: obj, items: [] });
    byObjective.get(obj.id)!.items.push(tkr);
  }
  return Array.from(byObjective.values());
}
