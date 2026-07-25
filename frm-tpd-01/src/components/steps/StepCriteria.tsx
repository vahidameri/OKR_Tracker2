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
      <Field
        number={1}
        label="معیارهای پذیرش"
        optional={fieldEnabled(state, 'criteria') && !fieldRequired(state, 'criteria')}
        disabled={!fieldEnabled(state, 'criteria')}
        disabledNote={disabledReason(state, 'criteria')}
        help="معیار پذیرش یعنی شرطی که اگر برقرار باشد، همه قبول دارند کار تمام شده است. هر معیار باید قابل مشاهده یا اندازه‌گیری باشد — یعنی دو نفر با دیدن نتیجه به یک جواب برسند. «سریع‌تر شود» معیار نیست؛ «زیر ۲ ثانیه کامل شود» معیار است. هر تعداد که لازم دارید اضافه کنید؛ اگر برایتان راحت‌تر است می‌توانید از قالب «با آنکه… وقتی… آنگاه…» استفاده کنید، اما اجباری نیست."
      >
        <RepeatableList
          listKey="criteria"
          items={state.criteria}
          dispatch={dispatch}
          itemName="معیار"
          minChars={GOOD_LENGTH.criterion}
          addLabel="افزودن معیار"
          multiline
          placeholders={[
            'نمونه: در کلاس‌های بالای ۲۰۰ نفر، ارسال تکلیف در کمتر از ۲ ثانیه کامل می‌شود.',
            'نمونه: اگر ارسال ناموفق بود، پیام خطای مشخص با امکان تلاش دوباره نمایش داده می‌شود.',
            'معیار بعدی…',
          ]}
        />
      </Field>

      <Field
        number={2}
        label="خارج از دامنه"
        optional={fieldEnabled(state, 'outOfScope') && !fieldRequired(state, 'outOfScope')}
        disabled={!fieldEnabled(state, 'outOfScope')}
        disabledNote={disabledReason(state, 'outOfScope')}
        help="مرز کار را مشخص می‌کند و جلوی بزرگ‌شدن ناخواستهٔ تسک را می‌گیرد. چیزهایی را بنویسید که کسی ممکن است انتظارشان را داشته باشد اما جزو این درخواست نیستند — مثلاً «بازطراحی ظاهر صفحه» یا «پشتیبانی از نسخهٔ وب». نوشتن «هیچ» به کسی کمک نمی‌کند."
      >
        <RepeatableList
          listKey="outOfScope"
          items={state.outOfScope}
          dispatch={dispatch}
          itemName="مورد"
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
        optional
        disabled={!fieldEnabled(state, 'successMetrics')}
        disabledNote={disabledReason(state, 'successMetrics')}
        help="عددی که چند هفته پس از انجام کار بتوان اندازه گرفت و فهمید ارزشش را داشت یا نه. با معیار پذیرش فرق دارد: معیار پذیرش می‌گوید کار درست ساخته شده، سنجهٔ موفقیت می‌گوید کار درستی ساخته شده."
      >
        <RepeatableList
          listKey="successMetrics"
          items={state.successMetrics}
          dispatch={dispatch}
          itemName="سنجه"
          minChars={GOOD_LENGTH.metric}
          addLabel="افزودن سنجه"
          placeholders={[
            'نمونه: میانگین زمان ارسال تکلیف زیر ۲ ثانیه در داشبورد',
            'سنجهٔ بعدی…',
          ]}
        />
      </Field>
    </StepShell>
  );
}
