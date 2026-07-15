/**
 * توکن‌های رنگ نمودارها — پالت اعتبارسنجی‌شده (حالت روشن).
 * رنگ وضعیت‌ها همیشه با برچسب متنی همراه است و هرگز به‌تنهایی معنا حمل نمی‌کند.
 */
export const chartTheme = {
  /** رنگ سری اصلی (تک‌سری) */
  primary: '#2a78d6',
  grid: '#e1e0d9',
  axisInk: '#898781',
  baseline: '#c3c2b7',
  surface: '#fcfcfb',
  /** پالت وضعیت (رزروشده) + آبی برای «تکمیل‌شده» */
  status: {
    ON_TRACK: '#0ca30c',
    AT_RISK: '#fab219',
    BLOCKED: '#d03b3b',
    COMPLETED: '#2a78d6',
  } as Record<string, string>,
  /** رمپ ترتیبی تک‌رنگ (آبی، روشن→تیره) برای مقدارهای پیوسته */
  seq: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
  /** خانه‌ی «صفر/خالی» در هیت‌مپ */
  empty: '#f0efec',
  tooltip: {
    fontFamily: 'Vazirmatn',
    direction: 'rtl' as const,
    borderRadius: 8,
    border: '1px solid #e1e0d9',
    boxShadow: '0 2px 8px rgba(11,11,11,0.08)',
    fontSize: 12,
  },
};

/** انتخاب پله‌ی رمپ ترتیبی بر اساس نسبت ۰ تا ۱ */
export function seqColor(ratio: number): string {
  if (ratio <= 0) return chartTheme.empty;
  const idx = Math.min(chartTheme.seq.length - 1, Math.floor(ratio * chartTheme.seq.length));
  return chartTheme.seq[idx];
}

/** متن روی پله‌های تیره‌ی رمپ باید سفید باشد */
export function seqInk(ratio: number): string {
  return ratio > 0.55 ? '#ffffff' : '#0b0b0b';
}
