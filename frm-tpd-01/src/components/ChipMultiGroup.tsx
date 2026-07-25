import { useRef } from 'react';
import type { ChipOption } from './ChipGroup';

interface Props<T extends string> {
  options: readonly ChipOption<T>[];
  values: readonly T[];
  onToggle: (value: T) => void;
  ariaLabel: string;
  columns?: number;
}

/**
 * گروه chip چندانتخابی. مثل گروه تک‌انتخابی، کل گروه یک توقفگاه Tab است و
 * جابه‌جایی داخل آن با کلیدهای جهت انجام می‌شود.
 */
export default function ChipMultiGroup<T extends string>({
  options,
  values,
  onToggle,
  ariaLabel,
  columns,
}: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const firstSelected = options.findIndex((o) => values.includes(o.value));
  const tabbable = firstSelected >= 0 ? firstSelected : 0;

  const move = (from: number, dir: 1 | -1) => {
    const next = (from + dir + options.length) % options.length;
    refs.current[next]?.focus();
  };

  return (
    <div
      className={`chip-group${columns ? ' chip-grid' : ''}`}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt, i) => {
        const selected = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="checkbox"
            aria-checked={selected}
            tabIndex={i === tabbable ? 0 : -1}
            className={`chip${selected ? ' selected' : ''}`}
            onClick={() => onToggle(opt.value)}
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
            <span className="chip-label">
              <span className="chip-check" aria-hidden>
                {selected ? '✓' : '+'}
              </span>
              {opt.label}
            </span>
            {opt.hint && <span className="chip-hint">{opt.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
