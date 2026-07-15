import { MetricType, ProgressStatus } from '@prisma/client';

export const STATUS_LABELS: Record<ProgressStatus, string> = {
  ON_TRACK: 'در مسیر',
  AT_RISK: 'در ریسک',
  BLOCKED: 'بلاک‌شده',
  COMPLETED: 'تکمیل‌شده',
};

export const STATUS_COLORS: Record<ProgressStatus, string> = {
  ON_TRACK: '#0ca30c',
  AT_RISK: '#fab219',
  BLOCKED: '#d03b3b',
  COMPLETED: '#2a78d6',
};

export const METRIC_LABELS: Record<MetricType, string> = {
  NUMERIC: 'عددی',
  BOOLEAN: 'بله/خیر (مایل‌استونی)',
  TEXT: 'محتوایی',
};

/** وضعیت خودکار زمانی: مقایسه‌ی پیشرفت واقعی با پیشرفت مورد انتظارِ زمان */
export type AutoStatus = 'AHEAD' | 'ON_SCHEDULE' | 'AT_RISK' | 'BEHIND';

export const AUTO_STATUS_LABELS: Record<AutoStatus, string> = {
  AHEAD: 'جلوتر از برنامه',
  ON_SCHEDULE: 'در مسیر',
  AT_RISK: 'در ریسک',
  BEHIND: 'عقب‌افتاده',
};

export const AUTO_STATUS_STYLES: Record<AutoStatus, string> = {
  AHEAD: 'bg-blue-100 text-blue-800',
  ON_SCHEDULE: 'bg-emerald-100 text-emerald-800',
  AT_RISK: 'bg-amber-100 text-amber-800',
  BEHIND: 'bg-red-100 text-red-800',
};

/**
 * آستانه‌های وضعیت خودکار (قابل تنظیم توسط ادمین از صفحه‌ی «تنظیمات»).
 * diff = پیشرفت واقعی − مورد انتظار (واحد: درصدپوینت):
 * diff ≥ +ahead → جلوتر؛ تا −atRisk → در مسیر؛ تا −behind → در ریسک؛ پایین‌تر → عقب‌افتاده.
 */
export interface AutoThresholds {
  ahead: number;
  atRisk: number;
  behind: number;
}

export const DEFAULT_THRESHOLDS: AutoThresholds = { ahead: 5, atRisk: 10, behind: 25 };

// وضعیت ماژول-سطح؛ توسط loadAutoThresholds از دیتابیس تازه می‌شود
let currentThresholds: AutoThresholds = { ...DEFAULT_THRESHOLDS };

export function setAutoThresholds(t: AutoThresholds) {
  currentThresholds = t;
}

export function getAutoThresholds(): AutoThresholds {
  return currentThresholds;
}

export function computeAutoStatus(actual: number, expected: number | null): AutoStatus | null {
  if (expected === null) return null;
  const t = currentThresholds;
  const diff = actual - expected;
  if (diff >= t.ahead) return 'AHEAD';
  if (diff >= -t.atRisk) return 'ON_SCHEDULE';
  if (diff >= -t.behind) return 'AT_RISK';
  return 'BEHIND';
}

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
    // حالت مایل‌استونی: currentValue = تعداد انجام‌شده و تارگت = تعداد کل مایل‌استون‌ها
    const target = tkr.targetValueOverride ?? tkr.keyResult.targetValue;
    if (checkIn.currentValue !== null && checkIn.currentValue !== undefined && target && target > 0) {
      return Math.round(Math.min(Math.max(checkIn.currentValue / target, 0), 1) * 100);
    }
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
