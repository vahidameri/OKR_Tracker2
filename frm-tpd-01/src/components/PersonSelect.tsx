import { useEffect, useMemo, useRef, useState } from 'react';
import type { Person } from '../data/people';
import { PEOPLE } from '../data/people';

interface Props {
  value: string | null;
  onChange: (id: string) => void;
}

/** دراپ‌داون سفارشی انتخاب شخص با جست‌وجوی تایپی و ناوبری کیبورد */
export default function PersonSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = PEOPLE.find((p) => p.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return PEOPLE;
    return PEOPLE.filter(
      (p) => p.name.includes(q) || p.role.includes(q),
    );
  }, [query]);

  // بستن با کلیک بیرون از دراپ‌داون
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // فوکوس روی جعبهٔ جست‌وجو پس از بازشدن
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

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

      {open && (
        <div className="person-panel">
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
            {filtered.length === 0 && (
              <li className="person-empty">موردی پیدا نشد</li>
            )}
            {filtered.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.id === value}
                  className={`person-option${i === activeIndex ? ' active' : ''}${
                    p.id === value ? ' selected' : ''
                  }`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(p)}
                >
                  <span className="person-name">{p.name}</span>
                  <span className="person-role">{p.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
