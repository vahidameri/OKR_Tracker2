import type { Action, ListKey } from '../state';
import { toFaDigits } from '../lib/jalali';

interface Props {
  listKey: ListKey;
  items: string[];
  dispatch: React.Dispatch<Action>;
  placeholders: string[];
  addLabel: string;
  /** نام مفرد آیتم، برای برچسب‌های دسترس‌پذیری */
  itemName: string;
  /** چند مورد باید همیشه بماند (دکمهٔ حذف زیر این تعداد غیرفعال می‌شود) */
  minItems?: number;
  multiline?: boolean;
  /** طول پیشنهادی هر مورد برای امتیاز کامل */
  minChars: number;
}

/** فهرست ورودی‌های قابل کم و زیاد کردن — برای معیارها، خارج از دامنه و سنجه‌ها */
export default function RepeatableList({
  listKey,
  items,
  dispatch,
  placeholders,
  addLabel,
  itemName,
  minItems = 1,
  multiline = false,
  minChars,
}: Props) {
  return (
    <div className="repeat-list">
      {items.map((value, index) => (
        <div className="repeat-row" key={index}>
          <span className="repeat-index" aria-hidden>
            {toFaDigits(index + 1)}
          </span>
          {multiline ? (
            <textarea
              className="text-area repeat-input"
              rows={2}
              value={value}
              placeholder={placeholders[index] ?? placeholders[placeholders.length - 1]}
              aria-label={`${itemName} ${index + 1}`}
              onChange={(e) =>
                dispatch({
                  type: 'listChange',
                  key: listKey,
                  index,
                  value: e.target.value,
                })
              }
            />
          ) : (
            <input
              type="text"
              className="text-input repeat-input"
              value={value}
              placeholder={placeholders[index] ?? placeholders[placeholders.length - 1]}
              aria-label={`${itemName} ${index + 1}`}
              onChange={(e) =>
                dispatch({
                  type: 'listChange',
                  key: listKey,
                  index,
                  value: e.target.value,
                })
              }
            />
          )}
          <span
            className={`repeat-state${
              value.trim().length >= minChars ? ' ok' : value.trim() ? ' short' : ''
            }`}
            aria-hidden
          />
          <button
            type="button"
            className="repeat-remove"
            tabIndex={-1}
            aria-label={`حذف ${itemName} ${index + 1}`}
            disabled={items.length <= minItems}
            onClick={() => dispatch({ type: 'listRemove', key: listKey, index })}
          >
            ✕
          </button>
        </div>
      ))}
      <div className="repeat-foot">
        <button
          type="button"
          className="btn subtle repeat-add"
          onClick={() => dispatch({ type: 'listAdd', key: listKey })}
        >
          + {addLabel}
        </button>
        <span className="repeat-hint">
          هر {itemName} از {toFaDigits(minChars)} کاراکتر امتیاز کامل می‌گیرد
        </span>
      </div>
    </div>
  );
}
