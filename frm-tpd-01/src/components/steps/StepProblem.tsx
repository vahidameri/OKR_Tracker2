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
  placeholder: string;
}[] = [
  {
    key: 'problem',
    label: 'صورت‌مسئله',
    hint: 'فقط مسئله، نه راه‌حل؛ حداکثر ۵ جمله',
    placeholder:
      'نمونه: معلمان در کلاس‌های بالای ۲۰۰ نفر هنگام ارسال تکلیف با کندی شدید مواجه می‌شوند و بخشی از آن‌ها ارسال را نیمه‌کاره رها می‌کنند.',
  },
  {
    key: 'currentState',
    label: 'وضعیت فعلی',
    hint: 'در صورت امکان با شاهد کمی',
    placeholder:
      'نمونه: میانگین زمان بارگذاری صفحهٔ تکلیف حدود ۸ ثانیه است (داشبورد گرافانا، تیر ۱۴۰۵) و نرخ خطای ارسال ۱۲٪ گزارش شده.',
  },
  {
    key: 'desiredState',
    label: 'وضعیت مطلوب',
    hint: 'نتیجه، نه پیاده‌سازی',
    placeholder:
      'نمونه: معلم بتواند تکلیف را در کمتر از ۲ ثانیه ارسال کند و نرخ خطای ارسال زیر ۱٪ باشد.',
  },
  {
    key: 'businessValue',
    label: 'ارزش کسب‌وکاری',
    hint: 'اگر انجام نشود چه از دست می‌رود؟',
    placeholder:
      'نمونه: با شروع سال تحصیلی، ادامهٔ کندی باعث ریزش معلمان فعال کلاسا و افت شاخص رضایت (NPS) می‌شود.',
  },
];

export default function StepProblem({ state, dispatch }: Props) {
  return (
    <StepShell title="شرح مسئله">
      {FIELDS.map((f) => (
        <Field key={f.key} label={f.label} hint={f.hint}>
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
