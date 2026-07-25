import StepShell from '../StepShell';
import Field from '../Field';
import RepeatableList from '../RepeatableList';
import type { Action, FormState } from '../../state';
import { isSkipped } from '../../state';

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
        help="معیار پذیرش یعنی شرطی که اگر برقرار باشد، همه قبول دارند کار تمام شده است. هر معیار باید قابل مشاهده یا اندازه‌گیری باشد — یعنی دو نفر با دیدن نتیجه به یک جواب برسند. «سریع‌تر شود» معیار نیست؛ «زیر ۲ ثانیه کامل شود» معیار است. هر تعداد که لازم دارید اضافه کنید؛ اگر برایتان راحت‌تر است می‌توانید از قالب «با آنکه… وقتی… آنگاه…» استفاده کنید، اما اجباری نیست."
      >
        <RepeatableList
          listKey="criteria"
          items={state.criteria}
          dispatch={dispatch}
          itemName="معیار"
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
        disabled={isSkipped(state, 'outOfScope')}
        disabledNote="چون این درخواست در مسیر سریع قرار گرفته، مرزبندی دامنه لازم نیست."
        help="مرز کار را مشخص می‌کند و جلوی بزرگ‌شدن ناخواستهٔ تسک را می‌گیرد. چیزهایی را بنویسید که کسی ممکن است انتظارشان را داشته باشد اما جزو این درخواست نیستند — مثلاً «بازطراحی ظاهر صفحه» یا «پشتیبانی از نسخهٔ وب». نوشتن «هیچ» به کسی کمک نمی‌کند."
      >
        <RepeatableList
          listKey="outOfScope"
          items={state.outOfScope}
          dispatch={dispatch}
          itemName="مورد"
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
        disabled={isSkipped(state, 'successMetrics')}
        disabledNote="چون این درخواست در مسیر سریع قرار گرفته، تعریف سنجهٔ موفقیت لازم نیست."
        help="عددی که چند هفته پس از انجام کار بتوان اندازه گرفت و فهمید ارزشش را داشت یا نه. با معیار پذیرش فرق دارد: معیار پذیرش می‌گوید کار درست ساخته شده، سنجهٔ موفقیت می‌گوید کار درستی ساخته شده."
      >
        <RepeatableList
          listKey="successMetrics"
          items={state.successMetrics}
          dispatch={dispatch}
          itemName="سنجه"
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
