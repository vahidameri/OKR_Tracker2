import StepShell from '../StepShell';
import ChipGroup from '../ChipGroup';
import ChipMultiGroup from '../ChipMultiGroup';
import Field from '../Field';
import FastTrackQuiz from '../FastTrackQuiz';
import type { Action, FormState } from '../../state';
import { REQUEST_TYPES } from '../../state';
import { PRODUCTS } from '../../data/people';
import { toFaDigits } from '../../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

const MAX_TITLE_WORDS = 12;

export default function StepTriage({ state, dispatch }: Props) {
  const wordCount = state.title.trim()
    ? state.title.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <StepShell
      title="مسیر بررسی و مشخصات"
      subtitle="پاسخ‌های این مرحله تعیین می‌کند ادامهٔ فرم چقدر مفصل باشد"
    >
      <Field
        number={1}
        label="مسیر بررسی"
        help="اول مشخص می‌کنیم این کار کوچک و کم‌ریسک است یا نه. اگر هر چهار گزاره «بله» باشد، درخواست وارد مسیر سریع می‌شود و در مراحل بعد سؤال‌های تحلیلی — ارزش کسب‌وکاری، خارج از دامنه، سنجهٔ موفقیت و وابستگی‌ها — غیرفعال می‌شوند تا وقتتان گرفته نشود. اگر مطمئن نیستید «خیر یا نمی‌دانم» را بزنید؛ این هیچ ایرادی ندارد و اولویت درخواست را کم نمی‌کند."
      >
        <FastTrackQuiz state={state} dispatch={dispatch} />
      </Field>

      <Field
        number={2}
        label="نوع درخواست"
        help="می‌توانید بیش از یک نوع را انتخاب کنید — مثلاً کاری که هم یک باگ را رفع می‌کند و هم قابلیتی اضافه می‌کند. اگر «باگ» را انتخاب کنید، یک مرحلهٔ اضافه برای جزئیات فنی باگ به فرم اضافه می‌شود."
      >
        <ChipMultiGroup
          ariaLabel="نوع درخواست"
          options={REQUEST_TYPES}
          values={state.requestTypes}
          onToggle={(value) => dispatch({ type: 'toggleRequestType', value })}
        />
      </Field>

      <Field
        number={3}
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

      <Field
        number={4}
        label="محصول هدف"
        help="محصولی که این کار روی آن انجام می‌شود؛ تعیین می‌کند درخواست به کدام تیم و کدام لید ارجاع شود. بر اساس نام شما پیش‌انتخاب شده و قابل تغییر است. اگر مطمئن نیستید یا به چند محصول مربوط است، «سایر» را بزنید تا مدیر برنامه تعیین کند."
      >
        <ChipGroup
          ariaLabel="محصول هدف"
          options={PRODUCTS.map((p) => ({ value: p, label: p }))}
          value={state.product}
          onChange={(product) => dispatch({ type: 'selectProduct', product })}
        />
      </Field>
    </StepShell>
  );
}
