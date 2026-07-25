import StepShell from '../StepShell';
import Field from '../Field';
import type { Action, FormState } from '../../state';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

const FIELDS: {
  key: 'problem' | 'currentState' | 'desiredState' | 'businessValue';
  label: string;
  hint: string;
  help: string;
  placeholder: string;
}[] = [
  {
    key: 'problem',
    label: 'صورت‌مسئله',
    hint: 'فقط مسئله، نه راه‌حل؛ حداکثر ۵ جمله',
    help: 'بنویسید چه چیزی درست کار نمی‌کند و برای چه کسی — نه اینکه چطور باید حل شود. اگر جمله‌تان شامل «باید فلان دکمه اضافه شود» یا نام یک فناوری است، آن راه‌حل است نه مسئله. راه‌حل را بگذارید تیم فنی پیشنهاد بدهد؛ ممکن است راه بهتری بلد باشد.',
    placeholder:
      'نمونه: معلمان در کلاس‌های بالای ۲۰۰ نفر هنگام ارسال تکلیف با کندی شدید مواجه می‌شوند و بخشی از آن‌ها ارسال را نیمه‌کاره رها می‌کنند.',
  },
  {
    key: 'currentState',
    label: 'وضعیت فعلی',
    hint: 'در صورت امکان با شاهد کمی',
    help: 'امروز دقیقاً چه اتفاقی می‌افتد؟ هر عددی که در دست دارید کمک می‌کند: زمان، درصد خطا، تعداد کاربر درگیر، تعداد تیکت پشتیبانی. اگر عدد دارید، منبع و بازهٔ زمانی‌اش را هم بنویسید تا بعداً قابل بازبینی باشد.',
    placeholder:
      'نمونه: میانگین زمان بارگذاری صفحهٔ تکلیف حدود ۸ ثانیه است (داشبورد گرافانا، تیر ۱۴۰۵) و نرخ خطای ارسال ۱۲٪ گزارش شده.',
  },
  {
    key: 'desiredState',
    label: 'وضعیت مطلوب',
    hint: 'نتیجه، نه پیاده‌سازی',
    help: 'اگر این کار انجام شود، کاربر چه چیزی را متفاوت تجربه می‌کند؟ نتیجه را بنویسید، نه روش رسیدن به آن. مراقب باشید این فیلد صرفاً نفیِ «وضعیت فعلی» نباشد — «دیگر کند نباشد» چیزی به تیم نمی‌گوید؛ «زیر ۲ ثانیه» می‌گوید.',
    placeholder:
      'نمونه: معلم بتواند تکلیف را در کمتر از ۲ ثانیه ارسال کند و نرخ خطای ارسال زیر ۱٪ باشد.',
  },
  {
    key: 'businessValue',
    label: 'ارزش کسب‌وکاری',
    hint: 'اگر انجام نشود چه از دست می‌رود؟',
    help: 'این فیلد تعیین‌کنندهٔ اولویت است. بنویسید هزینهٔ انجام‌ندادن چیست: ریزش کاربر، افت یک شاخص، کار دستی اضافه برای تیم پشتیبانی، ریسک قانونی. اگر به یکی از OKRهای فصل وصل است، همان را نام ببرید.',
    placeholder:
      'نمونه: با شروع سال تحصیلی، ادامهٔ کندی باعث ریزش معلمان فعال کلاسا و افت شاخص رضایت (NPS) می‌شود.',
  },
];

export default function StepProblem({ state, dispatch }: Props) {
  return (
    <StepShell title="شرح مسئله">
      {FIELDS.map((f, i) => (
        <Field key={f.key} number={i + 1} label={f.label} hint={f.hint} help={f.help}>
          <textarea
            className="text-area"
            rows={3}
            value={state[f.key]}
            placeholder={f.placeholder}
            onChange={(e) =>
              dispatch({ type: 'patch', patch: { [f.key]: e.target.value } })
            }
          />
        </Field>
      ))}
    </StepShell>
  );
}
