import { ProgressStatus } from '@prisma/client';
import { weekLabel } from '@/lib/jalali';
import { prisma } from '@/lib/prisma';
import { checkInProgress, weightedProgress } from '@/lib/progress';

const tkrInclude = {
  team: true,
  keyResult: { include: { objective: true } },
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

export interface TeamOverview {
  teamId: string;
  teamName: string;
  leadName: string | null;
  progress: number;
  krCount: number;
  statusCounts: Record<ProgressStatus, number>;
  lastCheckInAt: Date | null;
}

/** نمای کلی همه‌ی تیم‌ها + پیشرفت وزنی کل دپارتمان */
export async function getDepartmentOverview() {
  const [teams, tkrs] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
    fetchAllTkrs(),
  ]);

  const overviews: TeamOverview[] = teams.map((team) => {
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
    return {
      teamId: team.id,
      teamName: team.name,
      leadName: team.leadName,
      progress: weightedProgress(teamTkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) }))),
      krCount: teamTkrs.length,
      statusCounts,
      lastCheckInAt,
    };
  });

  // پیشرفت دپارتمان: میانگین وزنی روی تمام رکوردهای TeamKeyResult (نه وزن ثابت روی KR)
  const departmentProgress = weightedProgress(
    tkrs.map((t) => ({ weight: t.weight, progress: tkrProgress(t) }))
  );

  return { overviews, departmentProgress, totalTkrs: tkrs.length };
}

export interface TrendPoint {
  week: string;
  weekDate: string;
  progress: number;
}

/** روند هفتگی پیشرفت وزنی (کل دپارتمان یا یک تیم) */
export async function getWeeklyTrend(teamId?: string): Promise<TrendPoint[]> {
  const tkrs = await fetchAllTkrs(teamId);
  const weekSet = new Set<string>();
  for (const tkr of tkrs) {
    for (const c of tkr.checkIns) weekSet.add(c.weekStartDate.toISOString());
  }
  const weeks = Array.from(weekSet).sort();

  return weeks.map((weekIso) => {
    const items = tkrs.map((tkr) => {
      // آخرین چک‌این تا انتهای این هفته (چک‌این‌ها نزولی مرتب‌اند)
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
