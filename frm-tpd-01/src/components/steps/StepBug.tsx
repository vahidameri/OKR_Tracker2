import StepShell from '../StepShell';
import ChipGroup from '../ChipGroup';
import Field from '../Field';
import type { Action, FormState } from '../../state';
import { SEVERITIES } from '../../state';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepBug({ state, dispatch }: Props) {
  return (
    <StepShell title="اطلاعات تکمیلی باگ">
      <Field label="مراحل بازتولید">
        <textarea
          className="text-area"
          rows={4}
          value={state.bugSteps}
          placeholder={'۱. وارد اپ شاد شوید\n۲. به صفحهٔ تکالیف کلاس بروید\n۳. روی دکمهٔ ارسال بزنید'}
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { bugSteps: e.target.value } })
          }
        />
      </Field>

      <Field label="نتیجهٔ مشاهده‌شده">
        <textarea
          className="text-area"
          rows={2}
          value={state.bugObserved}
          placeholder="نمونه: اپ چند ثانیه هنگ می‌کند و پیام خطای نامشخص نمایش می‌دهد"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { bugObserved: e.target.value } })
          }
        />
      </Field>

      <Field label="نتیجهٔ مورد انتظار">
        <textarea
          className="text-area"
          rows={2}
          value={state.bugExpected}
          placeholder="نمونه: تکلیف ارسال و پیام تأیید نمایش داده شود"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { bugExpected: e.target.value } })
          }
        />
      </Field>

      <Field label="محیط، نسخه و دستگاه">
        <input
          type="text"
          className="text-input"
          value={state.bugEnv}
          placeholder="نمونه: اندروید ۱۴ / اپ شاد ۴٫۲٫۱"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { bugEnv: e.target.value } })
          }
        />
      </Field>

      <Field label="شدت پیشنهادی">
        <ChipGroup
          ariaLabel="شدت پیشنهادی"
          options={SEVERITIES}
          value={state.bugSeverity}
          onChange={(bugSeverity) =>
            dispatch({ type: 'patch', patch: { bugSeverity } })
          }
        />
      </Field>
    </StepShell>
  );
}
