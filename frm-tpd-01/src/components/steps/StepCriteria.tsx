import StepShell from '../StepShell';
import Field from '../Field';
import type { Action, FormState } from '../../state';
import { criteriaLines } from '../../state';
import { toFaDigits } from '../../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

const CRITERIA_PLACEHOLDER = `هر معیار را در یک خط جدا بنویسید. نمونه:

در کلاس‌های بالای ۲۰۰ نفر، ارسال تکلیف در کمتر از ۲ ثانیه کامل می‌شود.
اگر ارسال ناموفق بود، پیام خطای مشخص با امکان تلاش دوباره نمایش داده می‌شود.
تکلیف ارسال‌شده بلافاصله در فهرست تکالیف کلاس دیده می‌شود.`;

export default function StepCriteria({ state, dispatch }: Props) {
  const count = criteriaLines(state.criteria).length;

  return (
    <StepShell
      title="معیارهای پذیرش"
      subtitle="از کجا می‌فهمیم این کار درست انجام شده است؟"
    >
      <Field
        number={1}
        label="معیارهای پذیرش"
        hint="هر معیار در یک خط جدا"
        help="معیار پذیرش یعنی شرطی که اگر برقرار باشد، همه قبول دارند کار تمام شده است. هر معیار باید قابل مشاهده یا اندازه‌گیری باشد — یعنی دو نفر با دیدن نتیجه به یک جواب برسند. «سریع‌تر شود» معیار نیست؛ «زیر ۲ ثانیه کامل شود» معیار است. اگر برایتان راحت‌تر است، می‌توانید از قالب «با آنکه… وقتی… آنگاه…» استفاده کنید، اما اجباری نیست."
      >
        <textarea
          className="text-area criteria-area"
          rows={8}
          value={state.criteria}
          placeholder={CRITERIA_PLACEHOLDER}
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { criteria: e.target.value } })
          }
        />
        <p className="word-counter" aria-live="polite">
          {count > 0
            ? `${toFaDigits(count)} معیار نوشته شده است`
            : 'هنوز معیاری نوشته نشده'}
        </p>
      </Field>

      <Field
        number={2}
        label="خارج از دامنه"
        hint="دو موردی که عمداً در این درخواست انجام نمی‌شود"
        help="مرز کار را مشخص می‌کند و جلوی بزرگ‌شدن ناخواستهٔ تسک را می‌گیرد. چیزهایی را بنویسید که کسی ممکن است انتظارشان را داشته باشد اما جزو این درخواست نیستند — مثلاً «بازطراحی ظاهر صفحه» یا «پشتیبانی از نسخهٔ وب». نوشتن «هیچ» به کسی کمک نمی‌کند."
      >
        <input
          type="text"
          className="text-input"
          value={state.outOfScope1}
          placeholder="مورد اول — نمونه: تغییر ظاهر صفحهٔ تکالیف"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { outOfScope1: e.target.value } })
          }
        />
        <input
          type="text"
          className="text-input"
          value={state.outOfScope2}
          placeholder="مورد دوم — نمونه: پشتیبانی از نسخهٔ وب"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { outOfScope2: e.target.value } })
          }
        />
      </Field>

      <Field
        number={3}
        label="سنجهٔ موفقیت"
        hint="چه عددی نشان می‌دهد این کار موفق بوده؟"
        optional
        help="یک عدد که چند هفته پس از انجام کار بتوان اندازه گرفت و فهمید ارزشش را داشت یا نه. با معیار پذیرش فرق دارد: معیار پذیرش می‌گوید کار درست ساخته شده، سنجهٔ موفقیت می‌گوید کار درستی ساخته شده."
      >
        <input
          type="text"
          className="text-input"
          value={state.successMetric}
          placeholder="نمونه: میانگین زمان ارسال تکلیف زیر ۲ ثانیه در داشبورد"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { successMetric: e.target.value } })
          }
        />
      </Field>
    </StepShell>
  );
}
