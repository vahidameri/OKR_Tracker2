import StepShell from '../StepShell';
import Field from '../Field';
import RepeatableList from '../RepeatableList';
import type { Action, FormState } from '../../state';
import { disabledReason, fieldEnabled, fieldRequired } from '../../state';
import { GOOD_LENGTH } from '../../lib/limits';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepCriteria({ state, dispatch }: Props) {
  return (
    <StepShell
      title="معیارهای پذیرش و دامنه"
      subtitle="از کجا می‌فهمیم این کار درست انجام شده است؟"
    >
      {/* معیارهای پذیرش در این فرم پر نمی‌شود؛ فقط نشان می‌دهیم کجا نوشته می‌شود */}
      <Field
        number={1}
        label="معیارهای پذیرش"
        disabled
        disabledLabel="روی خود تسک"
        disabledNote={disabledReason(state, 'criteria')}
        help="معیار پذیرش یعنی شرطی که اگر برقرار باشد، همه قبول دارند کار تمام شده است. نوشتنش به جزئیات فنی راهکار وابسته است، پس در این فرم پر نمی‌شود: پس از بررسی اولیه، مدیر برنامه به‌همراه تیم فنی معیارها را روی خود تسک می‌نویسد."
      >
        <></>
      </Field>

      <Field
        number={2}
        label="خارج از دامنه"
        optional={fieldEnabled(state, 'outOfScope') && !fieldRequired(state, 'outOfScope')}
        disabled={!fieldEnabled(state, 'outOfScope')}
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
        number={3}
        label="سنجهٔ موفقیت"
        optional={
          fieldEnabled(state, 'successMetrics') && !fieldRequired(state, 'successMetrics')
        }
        disabled={!fieldEnabled(state, 'successMetrics')}
        disabledNote={disabledReason(state, 'successMetrics')}
        help="سه ماه پس از تحویل، با کدام عدد قضاوت می‌کنیم که درست بوده؟ اگر عددی به ذهنتان نمی‌رسد، احتمالاً ارزش کسب‌وکاری هم به‌اندازهٔ کافی مشخص نیست. با معیار پذیرش فرق دارد: معیار پذیرش می‌گوید کار درست ساخته شده، سنجهٔ موفقیت می‌گوید کار درستی ساخته شده."
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
