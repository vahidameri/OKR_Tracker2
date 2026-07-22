export interface ChipOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  options: readonly ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** برچسب دسترس‌پذیری گروه */
  ariaLabel: string;
}

/** گروه chip تک‌انتخابی؛ هر chip عنوان درشت و توضیح ریز دارد */
export default function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: Props<T>) {
  return (
    <div className="chip-group" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`chip${value === opt.value ? ' selected' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          <span className="chip-label">{opt.label}</span>
          {opt.hint && <span className="chip-hint">{opt.hint}</span>}
        </button>
      ))}
    </div>
  );
}
