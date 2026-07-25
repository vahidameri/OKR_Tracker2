import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Person } from '../data/people';
import { PEOPLE_SORTED } from '../data/people';
import { OTHER_PERSON_ID } from '../state';

interface Props {
  value: string | null;
  onChange: (id: string) => void;
}

/** گزینهٔ ثابت انتهای فهرست برای کسانی که در فهرست نیستند */
const OTHER_OPTION: Person = {
  id: OTHER_PERSON_ID,
  name: 'نام من در فهرست نیست',
  family: '',
  role: 'نام و سمت را خودم وارد می‌کنم',
};

/** فاصلهٔ امن از لبهٔ پنجره */
const EDGE = 12;

interface PanelBox {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

/** دراپ‌داون سفارشی انتخاب شخص با جست‌وجوی تایپی و ناوبری کیبورد */
export default function PersonSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<PanelBox | null>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const selected =
    value === OTHER_PERSON_ID
      ? OTHER_OPTION
      : (PEOPLE_SORTED.find((p) => p.id === value) ?? null);

  const filtered = useMemo(() => {
    const q = query.trim();
    // گزینهٔ «در فهرست نیست» همیشه در انتها می‌ماند
    if (!q) return [...PEOPLE_SORTED, OTHER_OPTION];
    const matches = PEOPLE_SORTED.filter(
      (p) => p.name.includes(q) || p.role.includes(q),
    );
    return [...matches, OTHER_OPTION];
  }, [query]);

  /**
   * پنل داخل body رندر می‌شود (portal) و position: fixed دارد.
   * این لازم است چون انیمیشن مرحله یک transform همانی روی .step-container
   * باقی می‌گذارد و همان برای عناصر fixed یک containing block می‌سازد —
   * بدون portal مختصات پنل نسبت به کارت حساب می‌شد، نه نسبت به پنجره.
   */
  const measure = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - EDGE;
    const above = rect.top - EDGE;
    // سمتی که فضای بیشتری دارد انتخاب می‌شود و ارتفاع دقیقاً همان فضاست
    const flip = above > below;
    const maxHeight = Math.floor(Math.max(0, flip ? above : below)) - 8;
    const next: PanelBox = {
      top: flip ? rect.top - maxHeight - 8 : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(96, maxHeight),
    };
    setBox((prev) =>
      prev &&
      prev.top === next.top &&
      prev.left === next.left &&
      prev.width === next.width &&
      prev.maxHeight === next.maxHeight
        ? prev
        : next,
    );
  }, []);

  // بستن با کلیک بیرون از دراپ‌داون یا پنل
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    setQuery('');
    setActiveIndex(0);
    requestAnimationFrame(() => searchRef.current?.focus());

    /*
     * موقعیت تریگر می‌تواند پس از بازشدن هم جابه‌جا شود — اسکرول نرم، انیمیشن
     * مرحله، یا تغییر چیدمان. به‌جای اندازه‌گیری در یک لحظهٔ خاص، تا وقتی پنل
     * باز است در هر فریم دنبالش می‌کنیم؛ state فقط وقتی عوض می‌شود که عدد
     * واقعاً تغییر کرده باشد.
     */
    let frame = 0;
    const follow = () => {
      measure();
      frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [open, measure]);

  // گزینهٔ فعال داخل کادر دید بماند — فقط داخل خود فهرست، بدون تکان‌دادن صفحه
  useEffect(() => {
    const el = activeRef.current;
    const list = el?.closest('.person-list');
    if (!el || !list) return;
    const e = el.getBoundingClientRect();
    const l = list.getBoundingClientRect();
    if (e.top < l.top) list.scrollTop -= l.top - e.top;
    else if (e.bottom > l.bottom) list.scrollTop += e.bottom - l.bottom;
  }, [activeIndex]);

  const pick = (p: Person) => {
    onChange(p.id);
    setOpen(false);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      // Enter داخل دراپ‌داون نباید مرحله را جلو ببرد
      e.preventDefault();
      e.stopPropagation();
      const p = filtered[activeIndex];
      if (p) pick(p);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="person-select" ref={rootRef}>
      <button
        type="button"
        className={`person-trigger${selected ? '' : ' placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <span className="person-trigger-inner">
            <span className="person-name">{selected.name}</span>
            <span className="person-role">{selected.role}</span>
          </span>
        ) : (
          'نام خود را انتخاب کنید'
        )}
        <span className="person-caret" aria-hidden>
          ▾
        </span>
      </button>

      {open &&
        box &&
        createPortal(
          <div
            ref={panelRef}
            className="person-panel"
            style={{
              top: box.top,
              left: box.left,
              width: box.width,
              maxHeight: box.maxHeight,
            }}
          >
            <input
              ref={searchRef}
              className="person-search"
              type="text"
              placeholder="جست‌وجو…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onSearchKeyDown}
            />
            <ul className="person-list" role="listbox">
              {filtered.map((p, i) => (
                <li key={p.id}>
                  <button
                    ref={i === activeIndex ? activeRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={p.id === value}
                    tabIndex={-1}
                    className={`person-option${i === activeIndex ? ' active' : ''}${
                      p.id === value ? ' selected' : ''
                    }${p.id === OTHER_PERSON_ID ? ' other' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(p)}
                  >
                    <span className="person-name">{p.name}</span>
                    <span className="person-role">{p.role}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
