import { prisma } from '@/lib/prisma';
import {
  DEFAULT_THRESHOLDS,
  setAutoThresholds,
  type AutoThresholds,
} from '@/lib/progress';

const CACHE_TTL_MS = 30_000;
let lastLoaded = 0;

/**
 * آستانه‌های وضعیت خودکار را از AppSetting می‌خواند و در ماژول progress ست می‌کند.
 * با کش ۳۰ ثانیه‌ای تا هر درخواست یک کوئری اضافه نزند.
 */
export async function loadAutoThresholds(): Promise<AutoThresholds> {
  const now = Date.now();
  if (now - lastLoaded < CACHE_TTL_MS) {
    const { getAutoThresholds } = await import('@/lib/progress');
    return getAutoThresholds();
  }
  lastLoaded = now;

  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ['threshold_ahead', 'threshold_at_risk', 'threshold_behind'] } },
  });
  const map = new Map(rows.map((r) => [r.key, Number(r.value)]));
  const valid = (v: number | undefined, fallback: number) =>
    v !== undefined && Number.isFinite(v) && v >= 0 && v <= 100 ? v : fallback;

  const thresholds: AutoThresholds = {
    ahead: valid(map.get('threshold_ahead'), DEFAULT_THRESHOLDS.ahead),
    atRisk: valid(map.get('threshold_at_risk'), DEFAULT_THRESHOLDS.atRisk),
    behind: valid(map.get('threshold_behind'), DEFAULT_THRESHOLDS.behind),
  };
  setAutoThresholds(thresholds);
  return thresholds;
}

export async function saveAutoThresholds(t: AutoThresholds) {
  const entries: [string, number][] = [
    ['threshold_ahead', t.ahead],
    ['threshold_at_risk', t.atRisk],
    ['threshold_behind', t.behind],
  ];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  );
  setAutoThresholds(t);
  lastLoaded = Date.now();
}
