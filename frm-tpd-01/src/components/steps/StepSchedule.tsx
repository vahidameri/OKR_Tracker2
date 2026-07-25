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
    <StepShell
      title="زمان‌بندی و مسیر"
      subtitle="این مرحله تعیین می‌کند درخواست از چه مسیری و با چه فوریتی بررسی شود"
    >
      <Field
        number={1}
        label="بررسی مسیر سریع"
        hint="هر گزاره را تأیید یا رد کنید؛ اگر هر چهار پاسخ «بله» باشد، درخواست وارد مسیر سریع می‌شود"
        help="مسیر سریع برای کارهای کوچک و کم‌ریسک است که بدون طی‌کردن چرخهٔ کامل برنامه‌ریزی انجام می‌شوند. اگر مطمئن نیستید، «خیر یا نمی‌دانم» را بزنید — این هیچ ایرادی ندارد و فقط یعنی درخواست از مسیر عادی بررسی می‌شود. پاسخ‌ها در سند درج می‌شود، پس صادقانه جواب دادن به نفع خودتان است."
      >
        <FastTrackQuiz state={state} dispatch={dispatch} />
      </Field>

      <Field
        number={2}
        label="اولویت پیشنهادی"
        hint="ورودی تصمیم است؛ اولویت نهایی با توافق مدیر برنامه و لیدها تعیین می‌شود"
        help="اولویت یعنی «چقدر زود باید انجام شود»، بر اساس اثر آن روی کار جاری و اهداف فصل — نه بر اساس اینکه چقدر برای شما مهم است. اگر همهٔ درخواست‌ها «بحرانی» باشند، عملاً هیچ‌کدام نیستند. «بحرانی» را وقتی بزنید که کاری همین حالا متوقف شده و راه دور زدنی وجود ندارد."
      >
        <ChipGroup
          ariaLabel="اولویت پیشنهادی"
          options={PRIORITIES}
          value={state.priority}
          onChange={(priority) => dispatch({ type: 'patch', patch: { priority } })}
        />
      </Field>

      <Field
        number={3}
        label="تاریخ نیاز و دلیل واقعی آن"
        optional
        hint="تاریخ را همراه با رویدادی که آن را الزامی می‌کند بنویسید"
        help="تاریخ بدون دلیل قابل برنامه‌ریزی نیست. «هرچه زودتر» تاریخ نیست. اگر مهلت واقعی دارید، به یک رویداد مشخص وصلش کنید: شروع سال تحصیلی، یک کمپین، یک الزام قانونی، یا وابستگی تیم دیگر. اگر تاریخ الزام‌آوری ندارید، این فیلد را خالی بگذارید."
      >
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
        number={4}
        label="وابستگی‌ها و پیوست‌ها"
        optional
        hint="لینک درایو سازمانی — بدون دادهٔ محرمانه"
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
