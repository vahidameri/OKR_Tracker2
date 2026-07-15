import { MetricType, ProgressStatus } from '@prisma/client';

export const STATUS_LABELS: Record<ProgressStatus, string> = {
  ON_TRACK: 'در مسیر',
  AT_RISK: 'در ریسک',
  BLOCKED: 'بلاک‌شده',
  COMPLETED: 'تکمیل‌شده',
};

export const STATUS_COLORS: Record<ProgressStatus, string> = {
  ON_TRACK: '#16a34a',
  AT_RISK: '#d97706',
  BLOCKED: '#dc2626',
  COMPLETED: '#2563eb',
};

export const METRIC_LABELS: Record<MetricType, string> = {
  NUMERIC: 'عددی',
  BOOLEAN: 'بله/خیر',
  TEXT: 'محتوایی',
};

export interface CheckInLike {
  currentValue: number | null;
  booleanValue: boolean | null;
  textValue: string | null;
  progressStatus: ProgressStatus;
}

export interface TkrLike {
  weight: number;
  targetValueOverride: number | null;
  minValueOverride: number | null;
  keyResult: {
    metricType: MetricType;
    minValue: number | null;
    targetValue: number | null;
  };
}

/**
 * درصد پیشرفت (۰ تا ۱۰۰) سهم یک تیم از یک KR بر اساس آخرین چک‌این.
 * - NUMERIC: نسبت (مقدار فعلی - حداقل) به (تارگت - حداقل)، با درنظرگرفتن override تیمی
 * - BOOLEAN: بله = ۱۰۰، خیر = ۰
 * - TEXT (کیفی): بر اساس progressStatus — تکمیل‌شده=۱۰۰، در مسیر=۵۰، در ریسک=۲۵، بلاک‌شده=۰
 */
export function checkInProgress(tkr: TkrLike, checkIn: CheckInLike | null | undefined): number {
  if (!checkIn) return 0;
  const { metricType } = tkr.keyResult;

  if (metricType === 'NUMERIC') {
    const target = tkr.targetValueOverride ?? tkr.keyResult.targetValue;
    const min = tkr.minValueOverride ?? tkr.keyResult.minValue ?? 0;
    const current = checkIn.currentValue;
    if (target === null || target === undefined || current === null || current === undefined) return 0;
    if (target === min) return current >= target ? 100 : 0;
    const ratio = (current - min) / (target - min);
    return Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  }

  if (metricType === 'BOOLEAN') {
    return checkIn.booleanValue ? 100 : 0;
  }

  // TEXT
  switch (checkIn.progressStatus) {
    case 'COMPLETED':
      return 100;
    case 'ON_TRACK':
      return 50;
    case 'AT_RISK':
      return 25;
    default:
      return 0;
  }
}

/** میانگین وزنی پیشرفت مجموعه‌ای از (TeamKeyResult + آخرین چک‌این) */
export function weightedProgress(items: { weight: number; progress: number }[]): number {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(items.reduce((s, i) => s + i.weight * i.progress, 0) / totalWeight);
}
