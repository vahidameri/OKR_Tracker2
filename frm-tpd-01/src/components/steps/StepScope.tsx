import StepShell from '../StepShell';
import Field from '../Field';
import RepeatableList from '../RepeatableList';
import type { Action, FormState } from '../../state';
import { disabledBadge, disabledReason, fieldEnabled, fieldRequired } from '../../state';
import { GOOD_LENGTH } from '../../lib/limits';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepScope({ state, dispatch }: Props) {
  return (
    <StepShell
      title="دامنه و سنجهٔ موفقیت"
      subtitle="مرز این کار کجاست و چطور می‌فهمیم ارزشش را داشت؟"
    >
      <Field
        number={1}
        label="خارج از دامنه"
        optional={fieldEnabled(state, 'outOfScope') && !fieldRequired(state, 'outOfScope')}
        disabled={!fieldEnabled(state, 'outOfScope')}
        disabledLabel={disabledBadge(state, 'outOfScope')}
        disabledNote={disabledReason(state, 'outOfScope')}
        help="چه چیزهایی عمداً جزو این درخواست نیست؟ این فیلد از خزش دامنه در مراحل بعد جلوگیری می‌کند. چیزهایی را بنویسید که کسی ممکن است انتظارشان را داشته باشد اما جزو این کار نیستند — مثلاً «بازطراحی ظاهر صفحه» یا «پشتیبانی از نسخهٔ وب». نوشتن «هیچ» به کسی کمک نمی‌کند."
      >
        <RepeatableList
          listKey="outOfScope"
          items={state.outOfScope}
          dispatch={dispatch}
          itemName="مورد"
          minItems={2}
          minChars={GOOD_LENGTH.scopeItem}
          addLabel="افزودن مورد"
          placeholders={[
            'نمونه: بازطراحی ظاهر صفحهٔ تکالیف',
            'نمونه: پشتیبانی از نسخهٔ وب',
            'مورد بعدی…',
          ]}
        />
      </Field>

      <Field
        number={2}
        label="سنجهٔ موفقیت"
        optional={
          fieldEnabled(state, 'successMetrics') && !fieldRequired(state, 'successMetrics')
        }
        disabled={!fieldEnabled(state, 'successMetrics')}
        disabledLabel={disabledBadge(state, 'successMetrics')}
        disabledNote={disabledReason(state, 'successMetrics')}
        help="سه ماه پس از تحویل، با کدام عدد قضاوت می‌کنیم که درست بوده؟ اگر عددی به ذهنتان نمی‌رسد، احتمالاً ارزش کسب‌وکاری هم به‌اندازهٔ کافی مشخص نیست. سنجهٔ موفقیت می‌گوید کارِ درستی ساخته شده — با معیار پذیرش که می‌گوید کار درست ساخته شده و بعداً همراه تیم فنی روی خود تسک نوشته می‌شود، فرق دارد."
      >
        <RepeatableList
          listKey="successMetrics"
          items={state.successMetrics}
          dispatch={dispatch}
          itemName="سنجه"
          minItems={2}
          minChars={GOOD_LENGTH.metric}
          addLabel="افزودن سنجه"
          placeholders={[
            'نمونه: میانگین زمان ارسال تکلیف زیر ۲ ثانیه در داشبورد',
            'نمونه: کاهش تیکت‌های پشتیبانی دربارهٔ ارسال تکلیف به نصف',
            'سنجهٔ بعدی…',
          ]}
        />
      </Field>
    </StepShell>
  );
}
