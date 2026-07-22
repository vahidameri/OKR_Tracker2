import type { Action, Criterion } from '../state';
import { criterionSentence, isCriterionComplete } from '../state';
import { toFaDigits } from '../lib/jalali';

interface Props {
  criteria: Criterion[];
  dispatch: React.Dispatch<Action>;
}

const PARTS: {
  field: 'given' | 'when' | 'then';
  prefix: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    field: 'given',
    prefix: 'با آنکه…',
    hint: 'وضعیت اولیه',
    placeholder: 'کاربر وارد صفحهٔ تکالیف شده است',
  },
  {
    field: 'when',
    prefix: 'وقتی…',
    hint: 'اقدام کاربر',
    placeholder: 'روی دکمهٔ ارسال می‌زند',
  },
  {
    field: 'then',
    prefix: 'آنگاه…',
    hint: 'نتیجهٔ قابل مشاهده',
    placeholder: 'پیام تأیید در کمتر از ۲ ثانیه نمایش داده می‌شود',
  },
];

/** سازندهٔ معیارهای پذیرش با پیش‌نمایش زندهٔ جملهٔ کامل */
export default function CriteriaBuilder({ criteria, dispatch }: Props) {
  return (
    <div className="criteria-builder">
      {criteria.map((c, index) => (
        <div className="criterion-card" key={c.id}>
          <div className="criterion-head">
            <span className="criterion-number">معیار {toFaDigits(index + 1)}</span>
            {criteria.length > 1 && (
              <button
                type="button"
                className="criterion-remove"
                aria-label={`حذف معیار ${toFaDigits(index + 1)}`}
                onClick={() => dispatch({ type: 'removeCriterion', id: c.id })}
              >
                حذف ✕
              </button>
            )}
          </div>
          {PARTS.map((part) => (
            <label className="criterion-row" key={part.field}>
              <span className="criterion-prefix">
                {part.prefix}
                <small>{part.hint}</small>
              </span>
              <input
                type="text"
                value={c[part.field]}
                placeholder={part.placeholder}
                onChange={(e) =>
                  dispatch({
                    type: 'updateCriterion',
                    id: c.id,
                    field: part.field,
                    value: e.target.value,
                  })
                }
              />
            </label>
          ))}
          {isCriterionComplete(c) && (
            <p className="criterion-preview">{criterionSentence(c)}</p>
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn subtle add-criterion"
        onClick={() => dispatch({ type: 'addCriterion' })}
      >
        + معیار دیگر
      </button>
    </div>
  );
}
