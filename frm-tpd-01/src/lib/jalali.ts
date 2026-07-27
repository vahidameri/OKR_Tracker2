// تبدیل تاریخ میلادی به شمسی — پیاده‌سازی الگوریتم بهزاد (همان الگوریتم jalaali-js)
// بدون وابستگی خارجی تا در شبکهٔ داخلی هم قابل اتکا باشد

function div(a: number, b: number): number {
  return ~~(a / b);
}

function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

/** شمارهٔ روز ژولینی از تاریخ میلادی */
function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

/** تاریخ میلادی از شمارهٔ روز ژولینی */
function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** محاسبهٔ کبیسه و روز شروع سال شمسی (نوروز) در تقویم میلادی */
function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;
  for (let i = 1; i < breaks.length; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export function toJalali(gy: number, gm: number, gd: number): JalaliDate {
  const jdn = g2d(gy, gm, gd);
  const gy2 = d2g(jdn).gy;
  let jy = gy2 - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy2, 3, r.march);
  let k = jdn - jdn1f;
  let jm: number;
  let jd: number;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

/** شمارهٔ روز ژولینی از تاریخ شمسی */
function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

/** تبدیل تاریخ شمسی به میلادی */
export function toGregorian(
  jy: number,
  jm: number,
  jd: number,
): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd));
}

/** آیا این سال شمسی کبیسه است؟ */
export function isLeapJalali(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

/** تعداد روزهای یک ماه شمسی */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalali(jy) ? 30 : 29;
}

/**
 * شمارهٔ ستون روز اول ماه در تقویمی که هفته با شنبه شروع می‌شود.
 * ‏getDay انگلیسی یکشنبه را صفر می‌گیرد، پس یک واحد جابه‌جا می‌شود.
 */
export function jalaliFirstWeekday(jy: number, jm: number): number {
  const { gy, gm, gd } = toGregorian(jy, jm, 1);
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
}

/** تاریخ شمسی امروز */
export function jalaliToday(date: Date = new Date()): JalaliDate {
  return toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** کلید متنی تاریخ برای نگهداری در state — نمونه: ‎1405-06-15 */
export function jalaliKey({ jy, jm, jd }: JalaliDate): string {
  return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
}

/** خواندن کلید متنی؛ اگر معتبر نبود null */
export function parseJalaliKey(key: string): JalaliDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (jm < 1 || jm > 12) return null;
  if (jd < 1 || jd > jalaliMonthLength(jy, jm)) return null;
  return { jy, jm, jd };
}

/** ترتیب دو تاریخ شمسی: منفی اگر a پیش از b باشد */
export function compareJalali(a: JalaliDate, b: JalaliDate): number {
  return a.jy - b.jy || a.jm - b.jm || a.jd - b.jd;
}

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** تبدیل ارقام لاتین به فارسی */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** سرستون‌های تقویم — هفته از شنبه شروع می‌شود */
export const JALALI_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/** تاریخ شمسی به شکل «۳۱ تیر ۱۴۰۵» */
export function formatJalali({ jy, jm, jd }: JalaliDate): string {
  return `${toFaDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toFaDigits(jy)}`;
}

/** همان قالب، از روی کلید متنی؛ کلید نامعتبر رشتهٔ خالی می‌دهد */
export function formatJalaliKey(key: string): string {
  const date = parseJalaliKey(key);
  return date ? formatJalali(date) : '';
}

/** تاریخ شمسی امروز به شکل «۳۱ تیر ۱۴۰۵» */
export function todayJalaliLabel(date: Date = new Date()): string {
  return formatJalali(jalaliToday(date));
}
