import StepShell from '../StepShell';
import Field from '../Field';
import CharCount from '../CharCount';
import type { Action, FormState } from '../../state';
import { disabledReason, fieldEnabled, fieldRequired } from '../../state';
import { MIN_CHARS } from '../../lib/limits';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

const FIELDS: {
  key: 'problem' | 'currentState' | 'desiredState' | 'businessValue';
  label: string;
  help: string;
  placeholder: string;
}[] = [
  {
    key: 'problem',
    label: 'صورت‌مسئله',
    help: 'بنویسید چه چیزی درست کار نمی‌کند و برای چه کسی — نه اینکه چطور باید حل شود؛ حداکثر ۵ جمله. اگر جمله‌تان شامل «باید فلان دکمه اضافه شود» یا نام یک فناوری است، آن راه‌حل است نه مسئله. راه‌حل را بگذارید تیم فنی پیشنهاد بدهد؛ ممکن است راه بهتری بلد باشد.',
    placeholder:
      'نمونه: معلمان در کلاس‌های بالای ۲۰۰ نفر هنگام ارسال تکلیف با کندی شدید مواجه می‌شوند و بخشی از آن‌ها ارسال را نیمه‌کاره رها می‌کنند.',
  },
  {
    key: 'currentState',
    label: 'وضعیت فعلی',
    help: 'امروز دقیقاً چه اتفاقی می‌افتد؟ هر عددی که در دست دارید کمک می‌کند: زمان، درصد خطا، تعداد کاربر درگیر، تعداد تیکت پشتیبانی. اگر عدد دارید، منبع و بازهٔ زمانی‌اش را هم بنویسید تا بعداً قابل بازبینی باشد.',
    placeholder:
      'نمونه: میانگین زمان بارگذاری صفحهٔ تکلیف حدود ۸ ثانیه است (داشبورد گرافانا، تیر ۱۴۰۵) و نرخ خطای ارسال ۱۲٪ گزارش شده.',
  },
  {
    key: 'desiredState',
    label: 'وضعیت مطلوب',
    help: 'اگر این کار انجام شود، کاربر چه چیزی را متفاوت تجربه می‌کند؟ نتیجه را بنویسید، نه روش رسیدن به آن. مراقب باشید این فیلد صرفاً نفیِ «وضعیت فعلی» نباشد — «دیگر کند نباشد» چیزی به تیم نمی‌گوید؛ «زیر ۲ ثانیه» می‌گوید.',
    placeholder:
      'نمونه: معلم بتواند تکلیف را در کمتر از ۲ ثانیه ارسال کند و نرخ خطای ارسال زیر ۱٪ باشد.',
  },
  {
    key: 'businessValue',
    label: 'ارزش کسب‌وکاری',
    help: 'این فیلد تعیین‌کنندهٔ اولویت است. بنویسید هزینهٔ انجام‌ندادن چیست: ریزش کاربر، افت یک شاخص، کار دستی اضافه برای تیم پشتیبانی، ریسک قانونی. اگر به یکی از OKRهای فصل وصل است، همان را نام ببرید.',
    placeholder:
      'نمونه: با شروع سال تحصیلی، ادامهٔ کندی باعث ریزش معلمان فعال کلاسا و افت شاخص رضایت (NPS) می‌شود.',
  },
];

export default function StepProblem({ state, dispatch }: Props) {
  return (
    <StepShell title="شرح مسئله">
      {FIELDS.map((f, i) => {
        // صورت‌مسئله همیشه الزامی است؛ بقیه بسته به نوع درخواست تغییر می‌کنند
        const gated = f.key === 'problem' ? null : f.key;
        const skipped = gated !== null && !fieldEnabled(state, gated);
        const optional = gated !== null && !skipped && !fieldRequired(state, gated);
        return (
          <Field
            key={f.key}
            number={i + 1}
            label={f.label}
            help={f.help}
            optional={optional}
            disabled={skipped}
            disabledNote={gated !== null ? disabledReason(state, gated) : undefined}
          >
            <textarea
              className="text-area"
              rows={3}
              value={state[f.key]}
              placeholder={f.placeholder}
              onChange={(e) =>
                dispatch({ type: 'patch', patch: { [f.key]: e.target.value } })
              }
            />
            <CharCount value={state[f.key]} min={MIN_CHARS[f.key]} />
          </Field>
        );
      })}
    </StepShell>
  );
}
