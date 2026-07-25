import StepShell from '../StepShell';
import PersonSelect from '../PersonSelect';
import Field from '../Field';
import type { Action, FormState } from '../../state';
import { OTHER_PERSON_ID, requesterInfo } from '../../state';
import { todayJalaliLabel } from '../../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepPerson({ state, dispatch }: Props) {
  const isOther = state.personId === OTHER_PERSON_ID;
  const requester = requesterInfo(state);

  return (
    <StepShell title="درخواست‌دهنده">
      <Field
        number={1}
        label="نام درخواست‌دهنده"
        help="نام خود را از فهرست انتخاب کنید. فهرست بر اساس نام خانوادگی مرتب شده و می‌توانید داخل آن جست‌وجو کنید. اگر نامتان در فهرست نبود، آخرین گزینه را انتخاب کنید تا نام و سمت را خودتان وارد کنید."
      >
        <PersonSelect
          value={state.personId}
          onChange={(id) => dispatch({ type: 'selectPerson', id })}
        />
      </Field>

      {isOther && (
        <>
          <Field
            number={2}
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
            number={3}
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

      {requester && (
        <p className="person-confirm">
          {requester.role ? `سمت: ${requester.role} · ` : ''}
          تاریخ ثبت: {todayJalaliLabel()}
        </p>
      )}
    </StepShell>
  );
}
