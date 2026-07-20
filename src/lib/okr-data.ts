import { ProgressStatus } from '@prisma/client';
import { weekLabel } from '@/lib/jalali';
import { expectedProgressForPeriod } from '@/lib/period';
import { prisma } from '@/lib/prisma';
import { checkInProgress, computeAutoStatus, weightedProgress, type AutoStatus } from '@/lib/progress';
import { formatCompact } from '@/lib/utils';

const tkrInclude = {
  team: true,
  keyResult: { include: { objective: true } },
  checkIns: {
    orderBy: { weekStartDate: 'desc' as const },
    include: {
      feedback: true,
      submittedBy: { select: { fullName: true } },
      editedBy: { select: { fullName: true } },
      comments: {
        orderBy: { createdAt: 'asc' as const },
        include: { author: { select: { fullName: true, role: true } } },
      },
    },
  },
};

export type TkrWithData = Awaited<ReturnType<typeof fetchAllTkrs>>[number];

export async function fetchAllTkrs(teamId?: string) {
  // آستانه‌های وضعیت خودکار را قبل از هر محاسبه تازه کن (کش ۳۰ ثانیه‌ای)
  const { loadAutoThresholds } = await import('@/lib/settings');
  await loadAutoThresholds();
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
export function expectedOf(tkrs: TkrWithData[], at: Date = new Date()): number | null {
  const items = tkrs
    .map((t) => ({ weight: t.weight, expected: expectedProgressForPeriod(t.keyResult.objective.period, at) }))
    .filter((i): i is { weight: number; expected: number } => i.expected !== null);
  if (items.length === 0) return null;
  return weightedProgress(items.map((i) => ({ weight: i.weight, progress: i.expected })));
}

export interface PersistentBlocker {
  teamId: string;
  teamName: string;
  krTitle: string;
  weeks: number;
  blocker: string | null;
}

/** بلاکرهای پایدار: KRهایی که آخرین چک‌این‌هایشان ۲ هفته‌ی متوالی یا بیشتر BLOCKED بوده */
export function computePersistentBlockers(tkrs: TkrWithData[]): PersistentBlocker[] {
  const result: PersistentBlocker[] = [];
  for (const tkr of tkrs) {
    let streak = 0;
    for (const c of tkr.checkIns) {
      if (c.progressStatus === 'BLOCKED') streak += 1;
      else break;
    }
    if (streak >= 2) {
      result.push({
        teamId: tkr.teamId,
        teamName: tkr.team.name,
        krTitle: tkr.keyResult.title,
        weeks: streak,
        blocker: tkr.checkIns[0]?.blockerDescription ?? null,
      });
    }
  }
  return result.sort((a, b) => b.weeks - a.weeks);
}

/** برچسب متنی آخرین مقدار ثبت‌شده‌ی یک KR-تیم */
export function latestValueLabel(tkr: TkrWithData): string {
  const latest = tkr.checkIns[0];
  const kr = tkr.keyResult;
  if (!latest) return '—';
  if (kr.metricType === 'NUMERIC') {
    return `${formatCompact(latest.currentValue)} ${kr.unit ?? ''}`.trim();
  }
  if (kr.metricType === 'BOOLEAN') {
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
  /** وضعیت pacing تیم در پایان آن هفته (خودکار) */
  autoStatus: AutoStatus | null;
  progressAtWeek: number;
}

export interface ComplianceRow {
  teamId: string;
  teamName: string;
  cells: ComplianceCell[];
}

/**
 * ماتریس تیم × هفته: ترکیب «ثبت/عدم‌ثبت چک‌این» و «وضعیت pacing» هر تیم در هر هفته
 * برای دید سریع کل دوره در یک نگاه.
 */
export function computeCompliance(teams: TeamRow[], tkrs: TkrWithData[]) {
  const weekSet = new Set<string>();
  for (const tkr of tkrs) {
    for (const c of tkr.checkIns) weekSet.add(c.weekStartDate.toISOString());
  }
  const weeks = Array.from(weekSet).sort().slice(-12); // ۱۲ هفته‌ی اخیر

  const rows: ComplianceRow[] = teams.map((team) => {
    const teamTkrs = tkrs.filter((t) => t.teamId === team.id);
    return {
      teamId: team.id,
      teamName: team.name,
      cells: weeks.map((weekIso) => {
        const submitted = teamTkrs.filter((t) =>
          t.checkIns.some((c) => c.weekStartDate.toISOString() === weekIso)
        ).length;
        // پیشرفت تیم تا انتهای آن هفته (آخرین چک‌این تا آن هفته carry-forward می‌شود)
        const progressAtWeek = weightedProgress(
          teamTkrs.map((tkr) => {
            const upTo = tkr.checkIns.find((c) => c.weekStartDate.toISOString() <= weekIso);
            return { weight: tkr.weight, progress: checkInProgress(tkr, upTo ?? null) };
          })
        );
        const weekEnd = new Date(new Date(weekIso).getTime() + 6 * 86400000);
        const expected = expectedOf(teamTkrs, weekEnd);
        return {
          weekIso,
          submitted,
          total: teamTkrs.length,
          ratio: teamTkrs.length === 0 ? 0 : submitted / teamTkrs.length,
          autoStatus: teamTkrs.length > 0 ? computeAutoStatus(progressAtWeek, expected) : null,
          progressAtWeek,
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
