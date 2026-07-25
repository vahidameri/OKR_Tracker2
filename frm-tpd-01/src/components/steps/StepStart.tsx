import StepShell from '../StepShell';
import ChipGroup from '../ChipGroup';
import PersonSelect from '../PersonSelect';
import Field from '../Field';
import type { Action, FormState } from '../../state';
import { DOC_TYPES, OTHER_PERSON_ID, requesterInfo } from '../../state';
import { toFaDigits, todayJalaliLabel } from '../../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

const MAX_TITLE_WORDS = 12;

export default function StepStart({ state, dispatch }: Props) {
  const chosen = state.docType !== null;
  const isOther = state.personId === OTHER_PERSON_ID;
  const requester = requesterInfo(state);
  const wordCount = state.title.trim()
    ? state.title.trim().split(/\s+/).filter(Boolean).length
    : 0;
  // شمارهٔ سؤال‌ها با ظاهرشدن فیلدهای دستی جابه‌جا می‌شود
  let n = 1;

  return (
    <StepShell
      title="نوع سند"
      subtitle="اول مشخص کنید چه سندی می‌خواهید بسازید"
    >
      <Field
        number={n++}
        label="سندی که می‌سازید"
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
          onChange={(docType) => dispatch({ type: 'patch', patch: { docType } })}
        />
      </Field>

      {chosen && (
        <>
          <Field
            number={n++}
            label="نام درخواست‌دهنده"
            help="نام خود را از فهرست انتخاب کنید. فهرست بر اساس نام خانوادگی مرتب شده و می‌توانید داخل آن جست‌وجو کنید. اگر نامتان در فهرست نبود، آخرین گزینه را انتخاب کنید تا نام و سمت را خودتان وارد کنید."
          >
            <PersonSelect
              value={state.personId}
              onChange={(id) => dispatch({ type: 'selectPerson', id })}
            />
            {requester && (
              <p className="person-confirm">
                {requester.role ? `سمت: ${requester.role} · ` : ''}
                تاریخ ثبت: {todayJalaliLabel()}
              </p>
            )}
          </Field>

          {isOther && (
            <>
              <Field
                number={n++}
                label="نام و نام خانوادگی"
                help="نامی که در سند رسمی و در ارجاع‌های بعدی به این درخواست ثبت می‌شود."
              >
                <input
                  type="text"
                  className="text-input"
                  value={state.customName}
                  placeholder="نمونه: سارا محمدی"
                  onChange={(e) =>
                    dispatch({ type: 'patch', patch: { customName: e.target.value } })
                  }
                />
              </Field>

              <Field
                number={n++}
                label="سمت سازمانی"
                help="سمت یا نقش شما؛ به مدیر برنامه کمک می‌کند بداند درخواست از کدام تیم آمده و برای هماهنگی با چه کسی تماس بگیرد."
              >
                <input
                  type="text"
                  className="text-input"
                  value={state.customRole}
                  placeholder="نمونه: کارشناس ارشد بازاریابی"
                  onChange={(e) =>
                    dispatch({ type: 'patch', patch: { customRole: e.target.value } })
                  }
                />
              </Field>
            </>
          )}

          <Field
            number={n++}
            label="عنوان درخواست"
            help="یک جملهٔ کوتاه که به‌تنهایی معنا بدهد؛ همین متن تیتر تسک می‌شود. قالب پیشنهادی: فعل + موضوع + برای چه کسی. به‌جای «مشکل تکالیف» بنویسید «کاهش زمان ارسال تکلیف برای معلمان کلاس‌های بزرگ». شمارندهٔ کلمات فقط یادآوری است و جلوی ادامه را نمی‌گیرد."
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
              {toFaDigits(wordCount)} از {toFaDigits(MAX_TITLE_WORDS)} کلمه
            </p>
          </Field>
        </>
      )}
    </StepShell>
  );
}
