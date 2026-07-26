import ChipGroup from './ChipGroup';
import PersonSelect from './PersonSelect';
import Field from './Field';
import CharCount from './CharCount';
import Logo from './Logo';
import type { Action, DocType, FormState } from '../state';
import {
  DOC_TYPES,
  OTHER_PERSON_ID,
  requesterDone,
  requesterInfo,
  titleDone,
} from '../state';
import { GOOD_LENGTH } from '../lib/limits';
import { todayJalaliLabel } from '../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
  canStart: boolean;
  missing: string[];
  onStart: () => void;
}

/**
 * صفحهٔ آغازین — پیش از شروع ویزارد. عنوان، درخواست‌دهنده و نوع سند اینجا
 * گرفته می‌شود و شمارش مراحل تازه از صفحهٔ بعد شروع می‌شود.
 *
 * فیلدها یکی‌یکی ظاهر می‌شوند: تا عنوان نوشته نشود سؤال دوم دیده نمی‌شود و
 * تا نام و سمت کامل نشود نوبت به نوع سند نمی‌رسد.
 */
export default function Landing({
  state,
  dispatch,
  canStart,
  missing,
  onStart,
}: Props) {
  const isOther = state.personId === OTHER_PERSON_ID;
  const requester = requesterInfo(state);
  const showRequester = titleDone(state);
  const showDocType = showRequester && requesterDone(state);
  let n = 1;

  return (
    <div className="landing">
      <div className="landing-head">
        <Logo size={64} />
        <h1 className="landing-title">فرم ثبت درخواست کار</h1>
        <p className="landing-sub">دپارتمان فناوری و محصول — همراه اول</p>
        <p className="landing-meta">
          FRM-TPD-01 · نسخهٔ ۳٫۰ · {todayJalaliLabel()}
        </p>
      </div>

      <div className="landing-body">
        <Field
          number={n++}
          label="عنوان درخواست"
          help="یک جملهٔ کوتاه که به‌تنهایی معنا بدهد؛ همین متن تیتر تسک می‌شود. قالب پیشنهادی: فعل + موضوع + برای چه کسی. به‌جای «مشکل تکالیف» بنویسید «کاهش زمان ارسال تکلیف برای معلمان کلاس‌های بزرگ»."
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
          <CharCount value={state.title} good={GOOD_LENGTH.title} />
        </Field>

        {showRequester && (
        <Field
          number={n++}
          label="نام و سمت درخواست‌دهنده"
          reveal
          help="نام خود را از فهرست انتخاب کنید. فهرست بر اساس نام خانوادگی مرتب شده و می‌توانید داخل آن جست‌وجو کنید. اگر نامتان در فهرست نبود، آخرین گزینه را انتخاب کنید تا نام و سمت را خودتان وارد کنید."
        >
          <PersonSelect
            value={state.personId}
            onChange={(id) => dispatch({ type: 'selectPerson', id })}
          />
          {requester && !isOther && (
            <p className="person-confirm">سمت: {requester.role}</p>
          )}
          {isOther && (
            <div className="landing-custom">
              <input
                type="text"
                className="text-input"
                value={state.customName}
                placeholder="نام و نام خانوادگی — نمونه: سارا محمدی"
                aria-label="نام و نام خانوادگی"
                onChange={(e) =>
                  dispatch({ type: 'patch', patch: { customName: e.target.value } })
                }
              />
              <input
                type="text"
                className="text-input"
                value={state.customRole}
                placeholder="سمت سازمانی — نمونه: کارشناس ارشد بازاریابی"
                aria-label="سمت سازمانی"
                onChange={(e) =>
                  dispatch({ type: 'patch', patch: { customRole: e.target.value } })
                }
              />
            </div>
          )}
        </Field>
        )}

        {showDocType && (
        <Field
          number={n++}
          label="نوع سند"
          reveal
          help="سند اطلاعات تسک (TID) برای یک کار مشخص و قابل تحویل است — قابلیت، بهبود، باگ یا وظیفهٔ فنی. سند نیازمندی محصول (PRD) برای تعریف یک محصول یا قابلیت بزرگ با چند تسک است و هنوز در دسترس نیست."
        >
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
        </Field>
        )}

        {showDocType && (
          <div className="landing-foot reveal">
            <button
              type="button"
              className="btn primary landing-start"
              disabled={!canStart}
              onClick={onStart}
            >
              شروع فرآیند ←
            </button>
            {!canStart && (
              <p className="landing-missing" aria-live="polite">
                برای شروع: {missing.join('، ')}
              </p>
            )}
          </div>
        )}

        <p className="landing-note">
          پر کردن این فرم نهایتاً ۵ دقیقه زمان می‌برد. هیچ اطلاعاتی ذخیره یا
          ارسال نمی‌شود؛ در پایان یک فایل PDF می‌گیرید و آن را به تسک پیوست
          می‌کنید.
        </p>
      </div>
    </div>
  );
}
