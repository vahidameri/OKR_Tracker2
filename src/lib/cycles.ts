import { setCycleCache } from '@/lib/period';
import { prisma } from '@/lib/prisma';

let lastLoaded = 0;
const TTL = 30_000;

/** بارگذاری دوره‌ها و ست‌کردن کش ماژول period (برای محاسبه‌ی پیشرفت مورد انتظار) */
export async function loadCycles() {
  const now = Date.now();
  if (now - lastLoaded < TTL) return;
  lastLoaded = now;
  const cycles = await prisma.cycle.findMany();
  setCycleCache(cycles.map((c) => [c.name, { start: c.startDate, end: c.endDate }]));
}

export function invalidateCyclesCache() {
  lastLoaded = 0;
}
