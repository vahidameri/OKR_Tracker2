import { useRef } from 'react';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  /** گزینه‌ای که هنوز فعال نیست (مثلاً سند PRD) */
  disabled?: boolean;
  disabledNote?: string;
}

interface Props<T extends string> {
  options: readonly ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** برچسب دسترس‌پذیری گروه */
  ariaLabel: string;
  /** chipهای بزرگ‌تر با توضیح دو خطی — برای انتخاب نوع سند */
  variant?: 'default' | 'card';
}

/**
 * گروه chip تک‌انتخابی. کل گروه یک توقفگاه Tab است (roving tabindex) و
 * جابه‌جایی داخل آن با کلیدهای جهت انجام می‌شود.
 */
export default function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  variant = 'default',
}: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = options.findIndex((o) => o.value === value);
  // اگر چیزی انتخاب نشده، اولین گزینهٔ فعال توقفگاه Tab است
  const tabbable = selectedIndex >= 0 ? selectedIndex : (enabled[0] ?? 0);

  const move = (from: number, dir: 1 | -1) => {
    const pos = enabled.indexOf(from);
    const next = enabled[(pos + dir + enabled.length) % enabled.length];
    refs.current[next]?.focus();
    onChange(options[next].value);
  };

  return (
    <div
      className={`chip-group${variant === 'card' ? ' chip-cards' : ''}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          disabled={opt.disabled}
          tabIndex={i === tabbable ? 0 : -1}
          className={`chip${value === opt.value ? ' selected' : ''}${
            opt.disabled ? ' chip-off' : ''
          }`}
          onClick={() => onChange(opt.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              move(i, 1);
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              move(i, -1);
            }
          }}
        >
          <span className="chip-label">{opt.label}</span>
          {opt.hint && <span className="chip-hint">{opt.hint}</span>}
          {opt.disabled && opt.disabledNote && (
            <span className="chip-badge">{opt.disabledNote}</span>
          )}
        </button>
      ))}
    </div>
  );
}
