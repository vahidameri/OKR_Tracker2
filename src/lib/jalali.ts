import * as jalaali from 'jalaali-js';

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/** تاریخ میلادی → رشته شمسی مثل «۱۴۰۵/۰۴/۲۴» */
export function formatJalali(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { jy, jm, jd } = jalaali.toJalaali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

/** تاریخ میلادی → رشته شمسی بلند مثل «۲۴ تیر ۱۴۰۵» */
export function formatJalaliLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { jy, jm, jd } = jalaali.toJalaali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  return `${jd} ${JALALI_MONTHS[jm - 1]} ${jy}`;
}

/** تاریخ و ساعت شمسی برای نمایش لاگ‌ها (به وقت محلی سرور) */
export function formatJalaliDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { jy, jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${jy}/${pad(jm)}/${pad(jd)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * شنبه‌ی ابتدای هفته‌ی جاری (هفته‌ی شمسی از شنبه شروع می‌شود).
 * به‌صورت نیمه‌شب UTC ذخیره می‌شود تا کلید یکتای هفته پایدار باشد.
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // getUTCDay: شنبه = 6 → فاصله از شنبه‌ی قبل
  const daysSinceSaturday = (d.getUTCDay() + 1) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceSaturday);
  return d;
}

/** برچسب هفته برای نمودارها، مثل «هفته ۲۴ تیر» */
export function weekLabel(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { jm, jd } = jalaali.toJalaali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  return `${jd} ${JALALI_MONTHS[jm - 1]}`;
}

/** دوره‌ی شمسی جاری، مثل «Q2-1405» */
export function currentJalaliQuarter(date: Date = new Date()): string {
  const { jy, jm } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const q = Math.ceil(jm / 3);
  return `Q${q}-${jy}`;
}

export const SEASON_NAMES = ['بهار', 'تابستان', 'پاییز', 'زمستان'];

/** اطلاعات فصل جاری برای هدر: «هفته ۳ تابستان ۱۴۰۵ (۱ تیر تا ۳۱ شهریور)» */
export function currentQuarterInfo(date: Date = new Date()): {
  label: string;
  quarterKey: string;
} {
  const { jy, jm } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const q = Math.ceil(jm / 3);
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const endDay = jalaali.jalaaliMonthLength(jy, endMonth);

  const s = jalaali.toGregorian(jy, startMonth, 1);
  const quarterStart = new Date(s.gy, s.gm - 1, s.gd);
  // شماره هفته بر مبنای شنبه‌های سپری‌شده از ابتدای فصل
  const startWeek = getWeekStart(quarterStart);
  const nowWeek = getWeekStart(date);
  const weekNo = Math.floor((nowWeek.getTime() - startWeek.getTime()) / (7 * 86400000)) + 1;

  const monthName = (m: number) => JALALI_MONTHS[m - 1];
  return {
    quarterKey: `Q${q}-${jy}`,
    label: `هفته ${weekNo} ${SEASON_NAMES[q - 1]} ${jy} (۱ ${monthName(startMonth)} تا ${endDay} ${monthName(endMonth)})`,
  };
}
