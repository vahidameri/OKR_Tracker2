import StepShell from '../StepShell';
import ChipGroup from '../ChipGroup';
import DatePicker from '../DatePicker';
import Field from '../Field';
import type { Action, FormState } from '../../state';
import {
  PRIORITIES,
  disabledBadge,
  disabledReason,
  fieldEnabled,
  isFastTrack,
} from '../../state';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepPriority({ state, dispatch }: Props) {
  let n = 1;

  return (
    <StepShell
      title="اولویت و وابستگی‌ها"
      subtitle={
        isFastTrack(state)
          ? 'این درخواست در مسیر سریع است، پس فقط اولویت و تاریخ نیاز پرسیده می‌شود'
          : 'تعیین می‌کند این درخواست با چه فوریتی و در کنار چه وابستگی‌هایی بررسی شود'
      }
    >
      <Field
        number={n++}
        label="اولویت پیشنهادی"
        help="اولویت یعنی «چقدر زود باید انجام شود»، بر اساس اثر آن روی کار جاری و اهداف فصل — نه بر اساس اینکه چقدر برای شما مهم است. اگر همهٔ درخواست‌ها «بحرانی» باشند، عملاً هیچ‌کدام نیستند. «بحرانی» را وقتی بزنید که کاری همین حالا متوقف شده و راه دور زدنی وجود ندارد. این ورودیِ تصمیم است؛ اولویت نهایی با توافق مدیر برنامه و لیدها تعیین می‌شود."
      >
        <ChipGroup
          ariaLabel="اولویت پیشنهادی"
          columns={4}
          options={PRIORITIES}
          value={state.priority}
          onChange={(priority) => dispatch({ type: 'patch', patch: { priority } })}
        />
      </Field>

      <Field
        number={n++}
        label="تاریخ نیاز و دلیل واقعی آن"
        optional
        help="تاریخ بدون دلیل قابل برنامه‌ریزی نیست و «هرچه زودتر» تاریخ نیست. اول تاریخ را از تقویم انتخاب کنید، بعد بنویسید چه چیزی آن را الزام‌آور می‌کند: شروع سال تحصیلی، یک کمپین، یک الزام قانونی، یا وابستگی تیم دیگر. اگر مهلت واقعی ندارید، تاریخ را خالی بگذارید — این هیچ ایرادی ندارد."
      >
        <DatePicker
          value={state.neededDate}
          ariaLabel="تاریخ نیاز"
          onChange={(neededDate) => dispatch({ type: 'patch', patch: { neededDate } })}
        />
        {/* دلیل فقط پس از انتخاب تاریخ معنا دارد، پس همان‌جا ظاهر می‌شود */}
        {state.neededDate && (
          <input
            type="text"
            className="text-input inline-other"
            value={state.neededReason}
            placeholder="این تاریخ را چه چیزی الزام‌آور می‌کند؟ — نمونه: پیش از شروع سال تحصیلی"
            aria-label="دلیل تاریخ نیاز"
            autoFocus
            onChange={(e) =>
              dispatch({ type: 'patch', patch: { neededReason: e.target.value } })
            }
          />
        )}
      </Field>

      <Field
        number={n++}
        label="وابستگی‌ها و پیوست‌ها"
        optional
        disabled={!fieldEnabled(state, 'dependencies')}
        disabledLabel={disabledBadge(state, 'dependencies')}
        disabledNote={disabledReason(state, 'dependencies')}
        help="هر چیزی که انجام این کار به آن گره خورده: تیم یا سرویس دیگری که باید کاری انجام دهد، تصمیمی که هنوز گرفته نشده، یا مستند و اسکرین‌شاتی که به فهم مسئله کمک می‌کند. فایل را مستقیم اینجا نگذارید؛ فقط لینک درایو سازمانی بدهید و از درج دادهٔ محرمانه یا اطلاعات شخصی کاربران خودداری کنید."
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
