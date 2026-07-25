import type { ChipOption } from './ChipGroup';

interface Props<T extends string> {
  options: readonly ChipOption<T>[];
  values: readonly T[];
  onToggle: (value: T) => void;
  ariaLabel: string;
}

/** گروه chip چندانتخابی — برای نوع درخواست که می‌تواند بیش از یکی باشد */
export default function ChipMultiGroup<T extends string>({
  options,
  values,
  onToggle,
  ariaLabel,
}: Props<T>) {
  return (
    <div className="chip-group" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const selected = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            className={`chip${selected ? ' selected' : ''}`}
            onClick={() => onToggle(opt.value)}
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
