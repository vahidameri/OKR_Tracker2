import StepShell from '../StepShell';
import ChipGroup from '../ChipGroup';
import ChipMultiGroup from '../ChipMultiGroup';
import Field from '../Field';
import FastTrackQuiz from '../FastTrackQuiz';
import type { Action, FormState } from '../../state';
import { REQUEST_TYPES } from '../../state';
import { PRODUCTS } from '../../data/people';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepRequest({ state, dispatch }: Props) {
  return (
    <StepShell
      title="نوع درخواست و مسیر بررسی"
      subtitle="پاسخ‌های این مرحله تعیین می‌کند ادامهٔ فرم چقدر مفصل باشد"
    >
      <Field
        number={1}
        label="نوع درخواست"
        help="می‌توانید بیش از یک نوع را انتخاب کنید — مثلاً کاری که هم یک باگ را رفع می‌کند و هم قابلیتی اضافه می‌کند. اگر «باگ» را انتخاب کنید، یک مرحلهٔ اضافه برای جزئیات فنی باگ به فرم اضافه می‌شود."
      >
        <ChipMultiGroup
          ariaLabel="نوع درخواست"
          columns={4}
          options={REQUEST_TYPES}
          values={state.requestTypes}
          onToggle={(value) => dispatch({ type: 'toggleRequestType', value })}
        />
      </Field>

      <Field
        number={2}
        label="محصول هدف"
        help="محصولی که این کار روی آن انجام می‌شود؛ تعیین می‌کند درخواست به کدام تیم و کدام لید ارجاع شود. بر اساس نام شما پیش‌انتخاب شده و قابل تغییر است. اگر مطمئن نیستید یا به چند محصول مربوط است، «سایر» را بزنید تا مدیر برنامه تعیین کند."
      >
        <ChipGroup
          ariaLabel="محصول هدف"
          columns={4}
          options={PRODUCTS.map((p) => ({ value: p, label: p }))}
          value={state.product}
          onChange={(product) => dispatch({ type: 'selectProduct', product })}
        />
      </Field>

      <Field
        number={3}
        label="مسیر بررسی"
        help="مشخص می‌کنیم این کار کوچک و کم‌ریسک است یا نه. اگر هر چهار گزاره «بله» باشد، درخواست وارد مسیر سریع می‌شود و در مراحل بعد سؤال‌های تحلیلی — ارزش کسب‌وکاری، خارج از دامنه، سنجهٔ موفقیت و وابستگی‌ها — غیرفعال می‌شوند تا وقتتان گرفته نشود. اگر مطمئن نیستید «خیر یا نمی‌دانم» را بزنید؛ این هیچ ایرادی ندارد و اولویت درخواست را کم نمی‌کند."
      >
        <FastTrackQuiz state={state} dispatch={dispatch} />
      </Field>
    </StepShell>
  );
}
