import * as jalaali from 'jalaali-js';

/**
 * پارس دوره‌ی شمسی به بازه‌ی زمانی میلادی.
 * فرمت‌های پشتیبانی‌شده: «Q1-1405» تا «Q4-1405» (فصل شمسی) و «1405» (کل سال).
 * اگر قابل پارس نباشد null برمی‌گردد و محاسبه‌ی خودکار برای آن دوره غیرفعال می‌شود.
 */
export function parsePeriod(period: string): { start: Date; end: Date } | null {
  const p = period.trim();

  const quarterMatch = p.match(/^Q([1-4])[-\s]?(\d{4})$/i);
  if (quarterMatch) {
    const q = Number(quarterMatch[1]);
    const jy = Number(quarterMatch[2]);
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const endDay = jalaali.jalaaliMonthLength(jy, endMonth);
    const s = jalaali.toGregorian(jy, startMonth, 1);
    const e = jalaali.toGregorian(jy, endMonth, endDay);
    return {
      start: new Date(Date.UTC(s.gy, s.gm - 1, s.gd)),
      end: new Date(Date.UTC(e.gy, e.gm - 1, e.gd, 23, 59, 59)),
    };
  }

  const yearMatch = p.match(/^(\d{4})$/);
  if (yearMatch) {
    const jy = Number(yearMatch[1]);
    const s = jalaali.toGregorian(jy, 1, 1);
    const endDay = jalaali.jalaaliMonthLength(jy, 12);
    const e = jalaali.toGregorian(jy, 12, endDay);
    return {
      start: new Date(Date.UTC(s.gy, s.gm - 1, s.gd)),
      end: new Date(Date.UTC(e.gy, e.gm - 1, e.gd, 23, 59, 59)),
    };
  }

  return null;
}

/**
 * پیشرفت مورد انتظار (۰ تا ۱۰۰) بر اساس نسبت زمان سپری‌شده از دوره.
 * قبل از شروع دوره ۰ و بعد از پایان آن ۱۰۰ است؛ دوره‌ی ناشناخته → null.
 */
export function expectedProgressForPeriod(period: string, now: Date = new Date()): number | null {
  const range = parsePeriod(period);
  if (!range) return null;
  const total = range.end.getTime() - range.start.getTime();
  if (total <= 0) return null;
  const elapsed = now.getTime() - range.start.getTime();
  return Math.round(Math.min(Math.max(elapsed / total, 0), 1) * 100);
}
