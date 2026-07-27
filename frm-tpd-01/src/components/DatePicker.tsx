import { useEffect, useMemo, useRef, useState } from 'react';
import type { JalaliDate } from '../lib/jalali';
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  compareJalali,
  formatJalali,
  jalaliFirstWeekday,
  jalaliKey,
  jalaliMonthLength,
  jalaliToday,
  parseJalaliKey,
  toFaDigits,
} from '../lib/jalali';

interface Props {
  /** کلید تاریخ شمسی، نمونه: ‎1405-06-15 — رشتهٔ خالی یعنی انتخاب‌نشده */
  value: string;
  onChange: (key: string) => void;
  /** برچسب دسترس‌پذیری دکمهٔ بازکنندهٔ تقویم */
  ariaLabel: string;
}

/**
 * تقویم شمسی — بدون هیچ وابستگی خارجی، روی همان توابع تبدیل خودمان.
 *
 * عمداً inline باز می‌شود و شناور (position: fixed) نیست. پنل شناور بیرون از
 * جریان صفحه است، پس اگر پایینش از لبهٔ پنجره بزند بیرون، اسکرول صفحه هرگز به
 * آن نمی‌رسد — و اگر پنجرهٔ مرورگر از ناحیهٔ قابل‌دیدن نمایشگر بلندتر باشد
 * (مثلاً زیر نوار وظیفه ادامه پیدا کند) هیچ محاسبه‌ای هم نمی‌تواند بفهمد.
 * وقتی تقویم داخل خود فرم باز می‌شود، مثل هر محتوای دیگری صفحه را بلندتر
 * می‌کند و با اسکرول عادی در دسترس است.
 */
export default function DatePicker({ value, onChange, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => jalaliToday(), []);
  const selected = useMemo(() => parseJalaliKey(value), [value]);
  // ماهی که تقویم نشان می‌دهد؛ با بازشدن روی تاریخ انتخابی یا امروز می‌نشیند
  const [view, setView] = useState<{ jy: number; jm: number }>(() => ({
    jy: (selected ?? today).jy,
    jm: (selected ?? today).jm,
  }));

  useEffect(() => {
    if (!open) return;
    const start = selected ?? today;
    setView({ jy: start.jy, jm: start.jm });
    // اگر تقویم پایین‌تر از لبهٔ پنجره باز شد، خودش را به دید بیاورد
    panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // فقط با بازشدن اجرا شود، نه با هر تغییر تاریخ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const raw = v.jm - 1 + delta;
      return { jy: v.jy + Math.floor(raw / 12), jm: (((raw % 12) + 12) % 12) + 1 };
    });
  };

  const days = jalaliMonthLength(view.jy, view.jm);
  const lead = jalaliFirstWeekday(view.jy, view.jm);
  const cells: (number | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  const pick = (jd: number) => {
    onChange(jalaliKey({ jy: view.jy, jm: view.jm, jd }));
    setOpen(false);
  };

  const isPast = (jd: number) =>
    compareJalali({ jy: view.jy, jm: view.jm, jd }, today) < 0;

  const sameDay = (a: JalaliDate | null, jd: number) =>
    !!a && a.jy === view.jy && a.jm === view.jm && a.jd === jd;

  return (
    <div className="datepicker">
      <div className="datepicker-bar">
        <button
          type="button"
          className={`datepicker-trigger${selected ? ' has-value' : ''}${
            open ? ' open' : ''
          }`}
          aria-expanded={open}
          aria-label={ariaLabel}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="datepicker-icon" aria-hidden>
            ▤
          </span>
          <span className="datepicker-value">
            {selected ? formatJalali(selected) : 'انتخاب تاریخ از تقویم'}
          </span>
          <span className="datepicker-caret" aria-hidden>
            {open ? '▲' : '▼'}
          </span>
        </button>
        {selected && (
          <button
            type="button"
            className="datepicker-clear"
            tabIndex={-1}
            onClick={() => onChange('')}
          >
            پاک‌کردن
          </button>
        )}
      </div>

      {open && (
        <div className="datepicker-panel" ref={panelRef} role="group" aria-label="تقویم">
          <div className="datepicker-head">
            {/* در RTL، «ماه قبل» سمت راست می‌نشیند */}
            <button
              type="button"
              className="datepicker-nav"
              aria-label="ماه قبل"
              onClick={() => shiftMonth(-1)}
            >
              ›
            </button>
            <span className="datepicker-title">
              {JALALI_MONTHS[view.jm - 1]} {toFaDigits(view.jy)}
            </span>
            <button
              type="button"
              className="datepicker-nav"
              aria-label="ماه بعد"
              onClick={() => shiftMonth(1)}
            >
              ‹
            </button>
          </div>

          <div className="datepicker-grid" role="grid">
            {JALALI_WEEKDAYS.map((w) => (
              <span className="datepicker-weekday" key={w} aria-hidden>
                {w}
              </span>
            ))}
            {cells.map((jd, i) =>
              jd === null ? (
                <span key={`x${i}`} />
              ) : (
                <button
                  key={jd}
                  type="button"
                  className={`datepicker-day${sameDay(selected, jd) ? ' selected' : ''}${
                    sameDay(today, jd) ? ' today' : ''
                  }`}
                  disabled={isPast(jd)}
                  aria-current={sameDay(today, jd) ? 'date' : undefined}
                  onClick={() => pick(jd)}
                >
                  {toFaDigits(jd)}
                </button>
              ),
            )}
          </div>

          <div className="datepicker-foot">
            <button
              type="button"
              className="datepicker-today"
              onClick={() => {
                onChange(jalaliKey(today));
                setOpen(false);
              }}
            >
              امروز — {formatJalali(today)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
