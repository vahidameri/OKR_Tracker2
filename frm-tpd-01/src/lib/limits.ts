// طول پیشنهادی هر فیلد متنی.
// اینها سد عبور نیستند — جلوی رفتن به مرحلهٔ بعد را نمی‌گیرند — بلکه در امتیاز
// آمادگی دخیل‌اند: پاسخ کوتاه نیمی از امتیاز آن محور را می‌گیرد.

export const GOOD_LENGTH = {
  title: 12,
  customName: 5,
  customRole: 3,
  problem: 40,
  currentState: 20,
  desiredState: 20,
  businessValue: 25,
  /** هر معیار پذیرش */
  criterion: 15,
  /** هر مورد خارج از دامنه */
  scopeItem: 8,
  /** هر سنجهٔ موفقیت */
  metric: 8,
} as const;

/** طول مؤثر یک متن (بدون فاصله‌های ابتدا و انتها) */
export function len(value: string): number {
  return value.trim().length;
}

/**
 * سهم امتیاز یک فیلد متنی:
 * خالی = ۰، نوشته‌شده ولی کوتاه = ۰٫۵، به‌اندازهٔ کافی = ۱
 */
export function lengthRatio(value: string, good: number): 0 | 0.5 | 1 {
  const n = len(value);
  if (n === 0) return 0;
  return n >= good ? 1 : 0.5;
}

/** موارد غیرخالی یک فهرست */
export function filled(items: string[]): string[] {
  return items.map((i) => i.trim()).filter(Boolean);
}

/**
 * سهم امتیاز یک فهرست: هر مورد به‌اندازهٔ کافی یک واحد، هر مورد کوتاه نیم واحد.
 * دو واحد یا بیشتر = امتیاز کامل.
 */
export function listRatio(items: string[], good: number): number {
  const units = filled(items).reduce(
    (sum, item) => sum + (item.length >= good ? 1 : 0.5),
    0,
  );
  return Math.min(1, units / 2);
}
