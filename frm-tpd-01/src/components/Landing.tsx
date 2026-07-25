import ChipGroup from './ChipGroup';
import Logo from './Logo';
import type { Action, DocType, FormState } from '../state';
import { DOC_TYPES } from '../state';
import { todayJalaliLabel } from '../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
  onStart: () => void;
}

/**
 * صفحهٔ آغازین — پیش از شروع ویزارد. نوع سند اینجا انتخاب می‌شود و
 * شمارش مراحل تازه از صفحهٔ بعد شروع می‌شود.
 */
export default function Landing({ state, dispatch, onStart }: Props) {
  return (
    <div className="landing">
      <div className="landing-head">
        <Logo size={72} />
        <h1 className="landing-title">فرم ثبت درخواست کار</h1>
        <p className="landing-sub">
          دپارتمان فناوری و محصول (CPTO) — همراه اول
        </p>
        <p className="landing-meta">
          FRM-TPD-01 · نسخهٔ ۲٫۰ · {todayJalaliLabel()}
        </p>
      </div>

      <div className="landing-body">
        <p className="landing-lead">
          برای شروع، مشخص کنید چه سندی می‌خواهید بسازید.
        </p>

        <ChipGroup
          ariaLabel="نوع سند"
          variant="card"
          options={DOC_TYPES.map((d) => ({
            value: d.value,
            label: `${d.label} — ${d.english}`,
            hint: d.hint,
            disabled: !d.available,
            disabledNote: d.available ? undefined : 'به‌زودی',
          }))}
          value={state.docType}
          onChange={(docType: DocType) =>
            dispatch({ type: 'patch', patch: { docType } })
          }
        />

        <button
          type="button"
          className="btn primary landing-start"
          disabled={!state.docType}
          onClick={onStart}
        >
          شروع فرآیند ←
        </button>

        <p className="landing-note">
          پر کردن فرم حدود ۵ تا ۱۰ دقیقه طول می‌کشد. هیچ اطلاعاتی ذخیره یا ارسال
          نمی‌شود؛ در پایان یک فایل PDF می‌گیرید و آن را به تسک پیوست می‌کنید.
        </p>
      </div>
    </div>
  );
}
