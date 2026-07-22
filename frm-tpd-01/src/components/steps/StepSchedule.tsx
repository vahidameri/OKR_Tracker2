import StepShell from '../StepShell';
import ChipGroup from '../ChipGroup';
import Field from '../Field';
import FastTrackQuiz from '../FastTrackQuiz';
import type { Action, FormState } from '../../state';
import { PRIORITIES } from '../../state';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepSchedule({ state, dispatch }: Props) {
  return (
    <StepShell title="زمان‌بندی و مسیر">
      <Field label="بررسی مسیر سریع" hint="اگر هر چهار پاسخ «بله» باشد، درخواست وارد مسیر سریع می‌شود">
        <FastTrackQuiz state={state} dispatch={dispatch} />
      </Field>

      <Field
        label="اولویت پیشنهادی"
        hint="ورودی تصمیم است؛ اولویت نهایی با توافق مدیر برنامه و لیدها تعیین می‌شود"
      >
        <ChipGroup
          ariaLabel="اولویت پیشنهادی"
          options={PRIORITIES}
          value={state.priority}
          onChange={(priority) => dispatch({ type: 'patch', patch: { priority } })}
        />
      </Field>

      <Field label="تاریخ نیاز و دلیل واقعی آن" optional>
        <input
          type="text"
          className="text-input"
          value={state.neededDate}
          placeholder="نمونه: تا ۱۵ شهریور — پیش از شروع سال تحصیلی"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { neededDate: e.target.value } })
          }
        />
      </Field>

      <Field
        label="وابستگی‌ها و پیوست‌ها"
        hint="لینک درایو سازمانی — بدون دادهٔ محرمانه"
        optional
      >
        <input
          type="text"
          className="text-input"
          value={state.dependencies}
          placeholder="نمونه: وابسته به سرویس احراز هویت / لینک مستند در درایو"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { dependencies: e.target.value } })
          }
        />
      </Field>
    </StepShell>
  );
}
