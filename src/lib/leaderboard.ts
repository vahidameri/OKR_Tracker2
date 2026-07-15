import * as jalaali from 'jalaali-js';
import { prisma } from '@/lib/prisma';
import {
  computeOverviews,
  fetchAllTkrs,
  type TeamOverview,
} from '@/lib/okr-data';

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/** کلید ماه شمسی، مثل «1405-04» */
export function jalaliMonthKey(date: Date = new Date()): string {
  const { jy, jm } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${jy}-${String(jm).padStart(2, '0')}`;
}

export function monthKeyLabel(key: string): string {
  const [jy, jm] = key.split('-').map(Number);
  if (!jy || !jm || jm < 1 || jm > 12) return key;
  return `${JALALI_MONTHS[jm - 1]} ${jy}`;
}

function prevMonthKey(key: string): string {
  const [jy, jm] = key.split('-').map(Number);
  return jm === 1 ? `${jy - 1}-12` : `${jy}-${String(jm - 1).padStart(2, '0')}`;
}

export interface Standing {
  rank: number;
  teamId: string;
  teamName: string;
  progress: number;
  expected: number | null;
  /** فاصله از برنامه: پیشرفت واقعی − مورد انتظار (دوره‌ی ناشناخته = مقایسه با ۰) */
  paceScore: number;
  isLast: boolean;
}

/** رتبه‌بندی لحظه‌ای تیم‌ها بر اساس pacing (تیم‌های بدون KR حذف می‌شوند) */
export function computeStandings(overviews: TeamOverview[]): Standing[] {
  const eligible = overviews.filter((o) => o.krCount > 0);
  const sorted = [...eligible].sort(
    (a, b) => b.progress - (b.expected ?? 0) - (a.progress - (a.expected ?? 0))
  );
  return sorted.map((o, i) => ({
    rank: i + 1,
    teamId: o.teamId,
    teamName: o.teamName,
    progress: o.progress,
    expected: o.expected,
    paceScore: Math.round((o.progress - (o.expected ?? 0)) * 10) / 10,
    isLast: i === sorted.length - 1 && sorted.length > 1,
  }));
}

export type LeaderboardHistoryMap = Map<string, { teamName: string; rank: number; paceScore: number }[]>;

/** تاریخچه‌ی اسنپ‌شات‌های ماهانه، گروه‌شده بر اساس ماه */
export async function getLeaderboardHistory(): Promise<LeaderboardHistoryMap> {
  const history = await prisma.monthlyLeaderboard.findMany({
    orderBy: [{ month: 'desc' }, { rank: 'asc' }],
    include: { team: { select: { name: true } } },
    take: 12 * 7,
  });
  const historyByMonth: LeaderboardHistoryMap = new Map();
  for (const h of history) {
    if (!historyByMonth.has(h.month)) historyByMonth.set(h.month, []);
    historyByMonth.get(h.month)!.push({ teamName: h.team.name, rank: h.rank, paceScore: h.paceScore });
  }
  return historyByMonth;
}

/** لیدربورد زنده + تاریخچه‌ی اسنپ‌شات‌های ماهانه */
export async function getLeaderboard() {
  const [teams, tkrs, historyByMonth] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
    fetchAllTkrs(),
    getLeaderboardHistory(),
  ]);
  const standings = computeStandings(computeOverviews(teams, tkrs));
  return { standings, historyByMonth };
}

/**
 * اسنپ‌شات خودکار پایان ماه: با شروع ماه شمسی جدید، رتبه‌بندی لحظه‌ی تغییر ماه
 * به‌عنوان کارنامه‌ی ماه قبل ذخیره می‌شود (idempotent — از AppSetting رد می‌شود).
 */
export async function snapshotLeaderboardIfMonthChanged() {
  const currentKey = jalaliMonthKey();
  const marker = await prisma.appSetting.findUnique({ where: { key: 'leaderboard_month_marker' } });

  if (!marker) {
    await prisma.appSetting.create({ data: { key: 'leaderboard_month_marker', value: currentKey } });
    return { snapshotted: false };
  }
  if (marker.value === currentKey) return { snapshotted: false };

  const monthToSnapshot = prevMonthKey(currentKey);
  const [teams, tkrs] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
    fetchAllTkrs(),
  ]);
  const standings = computeStandings(computeOverviews(teams, tkrs));

  await prisma.$transaction([
    ...standings.map((s) =>
      prisma.monthlyLeaderboard.upsert({
        where: { teamId_month: { teamId: s.teamId, month: monthToSnapshot } },
        create: {
          teamId: s.teamId,
          month: monthToSnapshot,
          rank: s.rank,
          paceScore: s.paceScore,
          progress: s.progress,
          expected: s.expected,
        },
        update: {},
      })
    ),
    prisma.appSetting.update({ where: { key: 'leaderboard_month_marker' }, data: { value: currentKey } }),
  ]);

  console.log(`[leaderboard] اسنپ‌شات ماه ${monthToSnapshot} برای ${standings.length} تیم ذخیره شد`);
  return { snapshotted: true, month: monthToSnapshot };
}
