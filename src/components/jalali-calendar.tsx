'use client';

import * as jalaali from 'jalaali-js';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/**
 * تقویم شمسی قابل ناوبری (کل سال و سال‌های دیگر): با فلش‌ها بین ماه‌ها جابه‌جا شوید،
 * روی نام ماه کلیک کنید تا نمای ۱۲ ماه سال باز شود. امروز پررنگ و بازه‌ی ثبت
 * چک‌این هفته‌ی جاری (شنبه تا یک‌شنبه) کهربایی است.
 */
export function JalaliCalendar() {
  const today = useMemo(() => {
    const now = new Date();
    const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysSinceSaturday = (midnight.getDay() + 1) % 7;
    return { ...j, weekStartMs: midnight.getTime() - daysSinceSaturday * 86400000 };
  }, []);

  const [view, setView] = useState<{ jy: number; jm: number }>({ jy: today.jy, jm: today.jm });
  const [yearMode, setYearMode] = useState(false);

  function shiftMonth(delta: number) {
    setView((v) => {
      let jm = v.jm + delta;
      let jy = v.jy;
      if (jm > 12) {
        jm = 1;
        jy += 1;
      }
      if (jm < 1) {
        jm = 12;
        jy -= 1;
      }
      return { jy, jm };
    });
  }

  const isCheckinDay = (jy: number, jm: number, dayNum: number) => {
    const g = jalaali.toGregorian(jy, jm, dayNum);
    const d = new Date(g.gy, g.gm - 1, g.gd);
    const offset = Math.round((d.getTime() - today.weekStartMs) / 86400000);
    // شنبه (offset ۰) و یک‌شنبه (offset ۱) هفته‌ی جاری
    return offset === 0 || offset === 1;
  };

  function monthCells(jy: number, jm: number): (number | null)[] {
    const monthLen = jalaali.jalaaliMonthLength(jy, jm);
    const first = jalaali.toGregorian(jy, jm, 1);
    const firstCol = (new Date(first.gy, first.gm - 1, first.gd).getDay() + 1) % 7;
    const cells: (number | null)[] = [
      ...Array.from({ length: firstCol }, () => null),
      ...Array.from({ length: monthLen }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  const navBtn = 'rounded-md border border-border px-2.5 py-1 text-sm hover:bg-muted';

  if (yearMode) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <button className={navBtn} onClick={() => setView((v) => ({ ...v, jy: v.jy - 1 }))} title="سال قبل">
            ‹
          </button>
          <span className="text-sm font-bold">{view.jy}</span>
          <button className={navBtn} onClick={() => setView((v) => ({ ...v, jy: v.jy + 1 }))} title="سال بعد">
            ›
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((name, i) => {
            const jm = i + 1;
            const isCurrent = view.jy === today.jy && jm === today.jm;
            return (
              <button
                key={name}
                onClick={() => {
                  setView({ jy: view.jy, jm });
                  setYearMode(false);
                }}
                className={cn(
                  'rounded-md border px-2 py-3 text-sm transition-colors',
                  isCurrent
                    ? 'border-primary bg-primary/10 font-bold text-primary'
                    : 'border-border hover:bg-muted'
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
        <button className="mt-2 w-full rounded-md border border-border py-1 text-xs text-muted-foreground hover:bg-muted"
          onClick={() => {
            setView({ jy: today.jy, jm: today.jm });
            setYearMode(false);
          }}
        >
          برو به امروز
        </button>
      </div>
    );
  }

  const cells = monthCells(view.jy, view.jm);
  const isTodayMonth = view.jy === today.jy && view.jm === today.jm;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button className={navBtn} onClick={() => shiftMonth(-1)} title="ماه قبل">
          ‹
        </button>
        <button
          className="rounded-md px-3 py-1 text-sm font-bold hover:bg-muted"
          onClick={() => setYearMode(true)}
          title="نمای کل سال"
        >
          {MONTHS[view.jm - 1]} {view.jy} ▾
        </button>
        <button className={navBtn} onClick={() => shiftMonth(1)} title="ماه بعد">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1 font-bold text-muted-foreground">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const col = i % 7; // ۵ = پنج‌شنبه، ۶ = جمعه
          const isWeekend = col === 5 || col === 6;
          return (
            <span
              key={day}
              className={cn(
                'rounded-md py-1.5 tabular-nums',
                isTodayMonth && day === today.jd
                  ? 'bg-primary font-black text-primary-foreground'
                  : isWeekend
                    ? 'bg-red-50 font-bold text-[#D03B3B]'
                    : isCheckinDay(view.jy, view.jm, day)
                      ? 'bg-amber-100 font-medium text-amber-900'
                      : 'text-foreground'
              )}
            >
              {day}
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="ml-1 inline-block h-3 w-3 rounded-sm bg-primary align-middle" /> امروز
            <span className="mx-1.5">·</span>
            <span className="ml-1 inline-block h-3 w-3 rounded-sm bg-amber-100 align-middle" /> بازه‌ی چک‌این
          </p>
        </div>
        {!isTodayMonth && (
          <button
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            onClick={() => setView({ jy: today.jy, jm: today.jm })}
          >
            برو به امروز
          </button>
        )}
      </div>
    </div>
  );
}
