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
    <StepShell
      title="اطلاعات تکمیلی باگ"
      subtitle="هرچه این بخش دقیق‌تر باشد، بازتولید باگ سریع‌تر انجام می‌شود"
    >
      <Field
        number={1}
        label="مراحل بازتولید"
        help="گام‌به‌گام بنویسید که یک نفر ناآشنا با دنبال‌کردن آن‌ها به همان خطا برسد. از نقطهٔ شروع مشخص آغاز کنید (کدام صفحه، با چه حسابی) و هر گام را در یک خط بنویسید. اگر باگ همیشه رخ نمی‌دهد، همین را بنویسید و بگویید تقریباً از هر چند بار یک بار."
      >
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

      <Field
        number={2}
        label="نتیجهٔ مشاهده‌شده"
        help="دقیقاً چه اتفاقی افتاد؟ متن خطا را عیناً بنویسید. اگر اسکرین‌شات یا ویدیو دارید، در مرحلهٔ بعد در «وابستگی‌ها و پیوست‌ها» لینک درایو سازمانی‌اش را بگذارید."
      >
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

      <Field
        number={3}
        label="نتیجهٔ مورد انتظار"
        help="به‌جای آن چه باید اتفاق می‌افتاد؟ این تفاوت است که ثابت می‌کند باگ است نه رفتار طراحی‌شده."
      >
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

      <Field
        number={4}
        label="محیط، نسخه و دستگاه"
        help="بدون این اطلاعات معمولاً باگ روی دستگاه تیم فنی بازتولید نمی‌شود. سیستم‌عامل و نسخه‌اش، نسخهٔ اپ (از صفحهٔ «دربارهٔ ما»)، و اگر مهم است مدل دستگاه یا مرورگر را بنویسید."
      >
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

      <Field
        number={5}
        label="شدت پیشنهادی"
        help="شدت یعنی «اثر این باگ چقدر است»، نه «چقدر عجله دارید» — آن دومی در مرحلهٔ بعد به‌عنوان اولویت پرسیده می‌شود. ملاک ساده: اگر کاربر هیچ راهی برای ادامهٔ کار ندارد بالا، اگر راه جایگزینی هست متوسط، اگر فقط آزاردهنده است پایین."
      >
        <ChipGroup
          ariaLabel="شدت پیشنهادی"
          columns={3}
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
