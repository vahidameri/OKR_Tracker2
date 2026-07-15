import * as jalaali from 'jalaali-js';
import { cn } from '@/lib/utils';

const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/**
 * تقویم شمسی ماه جاری. امروز پررنگ می‌شود و روزهای دوشنبه تا چهارشنبه‌ی هفته‌ی جاری
 * (بازه‌ی ثبت چک‌این) با پس‌زمینه‌ی کهربایی مشخص می‌شوند.
 */
export function JalaliCalendar() {
  const now = new Date();
  const { jy, jm, jd: today } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const monthLen = jalaali.jalaaliMonthLength(jy, jm);

  const first = jalaali.toGregorian(jy, jm, 1);
  const firstDate = new Date(first.gy, first.gm - 1, first.gd);
  // شنبه = ستون ۰
  const firstCol = (firstDate.getDay() + 1) % 7;

  // بازه‌ی چک‌این هفته‌ی جاری: دوشنبه تا چهارشنبه (getDay: Mon=1..Wed=3)
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceSaturday = (todayMidnight.getDay() + 1) % 7;
  const weekStartMs = todayMidnight.getTime() - daysSinceSaturday * 86400000;
  const isCheckinDay = (dayNum: number) => {
    const g = jalaali.toGregorian(jy, jm, dayNum);
    const d = new Date(g.gy, g.gm - 1, g.gd);
    const offset = Math.round((d.getTime() - weekStartMs) / 86400000);
    // فقط داخل هفته‌ی جاری (۰ تا ۶ نسبت به شنبه)
    if (offset < 0 || offset > 6) return false;
    const dow = d.getDay();
    return dow >= 1 && dow <= 3;
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstCol }, () => null),
    ...Array.from({ length: monthLen }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <p className="mb-2 text-center text-sm font-bold">
        {MONTHS[jm - 1]} {jy}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1 font-bold text-muted-foreground">
            {w}
          </span>
        ))}
        {cells.map((day, i) =>
          day === null ? (
            <span key={`e${i}`} />
          ) : (
            <span
              key={day}
              className={cn(
                'rounded-md py-1.5 tabular-nums',
                day === today
                  ? 'bg-primary font-black text-primary-foreground'
                  : isCheckinDay(day)
                    ? 'bg-amber-100 font-medium text-amber-900'
                    : 'text-foreground'
              )}
            >
              {day}
            </span>
          )
        )}
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p>
          <span className="ml-1 inline-block h-3 w-3 rounded-sm bg-primary align-middle" /> امروز
        </p>
        <p>
          <span className="ml-1 inline-block h-3 w-3 rounded-sm bg-amber-100 align-middle" /> بازه‌ی ثبت چک‌این این
          هفته (دوشنبه تا چهارشنبه)
        </p>
      </div>
    </div>
  );
}
