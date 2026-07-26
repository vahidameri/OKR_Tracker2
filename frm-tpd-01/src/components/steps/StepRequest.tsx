import StepShell from '../StepShell';
import ChipGroup from '../ChipGroup';
import Field from '../Field';
import FastTrackQuiz from '../FastTrackQuiz';
import type { Action, FormState, RequestType } from '../../state';
import { REQUEST_TYPES, isOtherProduct, isOtherRequestType } from '../../state';
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
        help="یک دسته را انتخاب کنید؛ همان تعیین می‌کند در مراحل بعد چه چیزهایی از شما پرسیده شود. اگر درخواست شما در هیچ‌یک از پنج دستهٔ اول جا نمی‌گیرد، «سایر» را بزنید و در کادری که باز می‌شود کوتاه توضیح بدهید."
      >
        <ChipGroup
          ariaLabel="نوع درخواست"
          columns={3}
          options={REQUEST_TYPES}
          value={state.requestType}
          onChange={(value: RequestType) =>
            dispatch({ type: 'selectRequestType', value })
          }
        />
        {/* «سایر» که انتخاب شد، خودِ کاربر دستهٔ درخواست را توضیح می‌دهد */}
        {isOtherRequestType(state) && (
          <input
            type="text"
            className="text-input inline-other"
            value={state.customRequestType}
            placeholder="این درخواست از چه جنسی است؟ — نمونه: هماهنگی با تیم حقوقی برای متن قرارداد"
            aria-label="توضیح نوع درخواست"
            autoFocus
            onChange={(e) =>
              dispatch({ type: 'patch', patch: { customRequestType: e.target.value } })
            }
          />
        )}
      </Field>

      <Field
        number={2}
        label="محصول هدف"
        help="محصولی که این کار روی آن انجام می‌شود؛ تعیین می‌کند درخواست به کدام تیم و کدام لید ارجاع شود. بر اساس نام شما پیش‌انتخاب شده و قابل تغییر است. اگر محصول موردنظرتان در فهرست نیست، «سایر» را بزنید و نامش را بنویسید."
      >
        <ChipGroup
          ariaLabel="محصول هدف"
          columns={4}
          options={PRODUCTS.map((p) => ({ value: p, label: p }))}
          value={state.product}
          onChange={(product) => dispatch({ type: 'selectProduct', product })}
        />
        {/* «سایر» که انتخاب شد، نام محصول را خود کاربر می‌نویسد */}
        {isOtherProduct(state) && (
          <input
            type="text"
            className="text-input inline-other"
            value={state.customProduct}
            placeholder="نام محصول یا سرویس — نمونه: سامانهٔ احراز هویت"
            aria-label="نام محصول"
            autoFocus
            onChange={(e) =>
              dispatch({ type: 'patch', patch: { customProduct: e.target.value } })
            }
          />
        )}
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
