import StepShell from '../StepShell';
import ChipGroup from '../ChipGroup';
import Field from '../Field';
import type { Action, FormState } from '../../state';
import { REQUEST_TYPES } from '../../state';
import { PRODUCTS } from '../../data/people';
import { toFaDigits } from '../../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

const MAX_TITLE_WORDS = 12;

export default function StepType({ state, dispatch }: Props) {
  const wordCount = state.title.trim()
    ? state.title.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <StepShell title="نوع و مشخصات">
      <Field label="نوع درخواست">
        <ChipGroup
          ariaLabel="نوع درخواست"
          options={REQUEST_TYPES}
          value={state.requestType}
          onChange={(requestType) =>
            dispatch({ type: 'patch', patch: { requestType } })
          }
        />
      </Field>

      <Field
        label="عنوان درخواست"
        hint={`فعل + موضوع + برای چه کسی — حداکثر ${toFaDigits(MAX_TITLE_WORDS)} کلمه`}
      >
        <input
          type="text"
          className="text-input"
          value={state.title}
          placeholder="نمونه: کاهش زمان بارگذاری صفحهٔ تکالیف برای معلمان"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { title: e.target.value } })
          }
        />
        <p
          className={`word-counter${wordCount > MAX_TITLE_WORDS ? ' over' : ''}`}
          aria-live="polite"
        >
          {toFaDigits(wordCount)} / {toFaDigits(MAX_TITLE_WORDS)} کلمه
        </p>
      </Field>

      <Field label="محصول هدف" hint="بر اساس نام شما پیش‌انتخاب شده؛ قابل تغییر است">
        <ChipGroup
          ariaLabel="محصول هدف"
          options={PRODUCTS.map((p) => ({ value: p, label: p }))}
          value={state.product}
          onChange={(product) => dispatch({ type: 'selectProduct', product })}
        />
      </Field>
    </StepShell>
  );
}
