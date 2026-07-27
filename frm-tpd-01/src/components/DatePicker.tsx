import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

/** فاصلهٔ امن از لبهٔ پنجره */
const EDGE = 12;

interface PanelBox {
  top: number;
  left: number;
}

const PANEL_WIDTH = 290;
const PANEL_HEIGHT = 340;

/**
 * تقویم شمسی — بدون هیچ وابستگی خارجی، روی همان توابع تبدیل خودمان.
 * مثل فهرست افراد، پنل با portal داخل body می‌رود چون انیمیشن مرحله یک
 * transform همانی روی کارت باقی می‌گذارد و همان برای عناصر fixed یک
 * containing block می‌سازد.
 */
export default function DatePicker({ value, onChange, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<PanelBox | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => jalaliToday(), []);
  const selected = useMemo(() => parseJalaliKey(value), [value]);
  // ماهی که تقویم نشان می‌دهد؛ با بازشدن روی تاریخ انتخابی یا امروز می‌نشیند
  const [view, setView] = useState<{ jy: number; jm: number }>(() => ({
    jy: (selected ?? today).jy,
    jm: (selected ?? today).jm,
  }));

  const measure = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - EDGE;
    // اگر پایین جا نبود، بالای دکمه باز شود
    const flip = below < PANEL_HEIGHT && rect.top > below;
    const top = flip ? rect.top - PANEL_HEIGHT - 8 : rect.bottom + 8;
    const left = Math.min(
      Math.max(EDGE, rect.right - PANEL_WIDTH),
      window.innerWidth - PANEL_WIDTH - EDGE,
    );
    const next = { top: Math.max(EDGE, top), left };
    setBox((prev) =>
      prev && prev.top === next.top && prev.left === next.left ? prev : next,
    );
  }, []);

  // بستن با کلیک بیرون
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    const start = selected ?? today;
    setView({ jy: start.jy, jm: start.jm });
    // موقعیت دکمه ممکن است پس از بازشدن هم جابه‌جا شود؛ هر فریم دنبالش می‌کنیم
    let frame = 0;
    const follow = () => {
      measure();
      frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [open, measure, selected, today]);

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const raw = v.jm - 1 + delta;
      return { jy: v.jy + Math.floor(raw / 12), jm: ((raw % 12) + 12) % 12 + 1 };
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
    <div className="datepicker" ref={rootRef}>
      <button
        type="button"
        className={`datepicker-trigger${selected ? ' has-value' : ''}`}
        aria-haspopup="dialog"
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
      </button>

      {selected && (
        <button
          type="button"
          className="datepicker-clear"
          tabIndex={-1}
          onClick={() => onChange('')}
        >
          پاک‌کردن تاریخ
        </button>
      )}

      {open &&
        box &&
        createPortal(
          <div
            className="datepicker-panel"
            ref={panelRef}
            role="dialog"
            aria-label="تقویم"
            style={{ top: box.top, left: box.left, width: PANEL_WIDTH }}
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
}
