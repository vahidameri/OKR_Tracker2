import StepShell from '../StepShell';
import PersonSelect from '../PersonSelect';
import Field from '../Field';
import CharCount from '../CharCount';
import type { Action, FormState } from '../../state';
import { OTHER_PERSON_ID, requesterInfo } from '../../state';
import { MIN_CHARS } from '../../lib/limits';
import { todayJalaliLabel } from '../../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepTitle({ state, dispatch }: Props) {
  const isOther = state.personId === OTHER_PERSON_ID;
  const requester = requesterInfo(state);
  let n = 1;

  return (
    <StepShell
      title="عنوان و درخواست‌دهنده"
      subtitle="با یک جملهٔ روشن شروع کنید؛ همین متن تیتر تسک می‌شود"
    >
      <Field
        number={n++}
        label="عنوان درخواست"
        help="یک جملهٔ کوتاه که به‌تنهایی معنا بدهد. قالب پیشنهادی: فعل + موضوع + برای چه کسی. به‌جای «مشکل تکالیف» بنویسید «کاهش زمان ارسال تکلیف برای معلمان کلاس‌های بزرگ»."
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
        <CharCount value={state.title} min={MIN_CHARS.title} />
      </Field>

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
            <CharCount value={state.customName} min={MIN_CHARS.customName} />
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
            <CharCount value={state.customRole} min={MIN_CHARS.customRole} />
          </Field>
        </>
      )}
    </StepShell>
  );
}
