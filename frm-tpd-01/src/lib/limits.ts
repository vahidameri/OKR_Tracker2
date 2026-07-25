// حداقل طول هر فیلد متنی. هدف جلوگیری از پاسخ‌های یک‌کلمه‌ای مثل «کند است»
// یا «مهم است» است که برای تیم فنی قابل استفاده نیستند.

export const MIN_CHARS = {
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
  bugSteps: 25,
  bugObserved: 10,
  bugExpected: 10,
  bugEnv: 5,
} as const;

/** طول مؤثر یک متن (بدون فاصله‌های ابتدا و انتها) */
export function len(value: string): number {
  return value.trim().length;
}

/** آیا این متن به حداقل رسیده است؟ */
export function meets(value: string, min: number): boolean {
  return len(value) >= min;
}

/** موارد یک فهرست که به حداقل طول رسیده‌اند */
export function validItems(items: string[], min: number): string[] {
  return items.map((i) => i.trim()).filter((i) => i.length >= min);
}
