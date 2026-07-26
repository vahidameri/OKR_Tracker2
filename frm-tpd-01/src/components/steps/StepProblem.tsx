import StepShell from '../StepShell';
import Field from '../Field';
import CharCount from '../CharCount';
import type { Action, FormState, GatedField, RequestType } from '../../state';
import { disabledReason, fieldEnabled, fieldRequired } from '../../state';
import { GOOD_LENGTH } from '../../lib/limits';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

type FieldKey = 'problem' | 'currentState' | 'desiredState' | 'businessValue';

/**
 * راهنمای هر فیلد: یک متن پایه که همیشه دیده می‌شود، به‌اضافهٔ نکته‌هایی که
 * فقط برای بعضی نوع‌های درخواست معنا دارند. چون نوع درخواست تک‌انتخابی است،
 * تنها نکتهٔ مربوط به همان نوع نشان داده می‌شود تا راهنما شلوغ نشود.
 */
const FIELDS: {
  key: FieldKey;
  label: string;
  help: string;
  perType?: Partial<Record<RequestType, string>>;
  placeholder: string;
}[] = [
  {
    key: 'problem',
    label: 'صورت‌مسئله',
    help: 'مسئله را بنویسید، نه راهکار را. اگر جمله‌تان با فعل «اضافه کنید / بسازید» شروع می‌شود، احتمالاً راهکار نوشته‌اید. راه‌حل را بگذارید تیم فنی پیشنهاد بدهد؛ ممکن است راه بهتری بلد باشد.',
    placeholder:
      'نمونه: معلمان در کلاس‌های بالای ۲۰۰ نفر هنگام ارسال تکلیف با کندی شدید مواجه می‌شوند و بخشی از آن‌ها ارسال را نیمه‌کاره رها می‌کنند.',
  },
  {
    key: 'currentState',
    label: 'وضعیت فعلی',
    help: 'امروز چه می‌گذرد؟ هر عددی که در دست دارید کمک می‌کند: زمان، درصد خطا، تعداد کاربر درگیر، تعداد تیکت پشتیبانی.',
    perType: {
      bug: 'رفتار مشاهده‌شده + گام‌های بازتولید + نسخه و دستگاه را بنویسید.',
      feature: 'راهکار جایگزینی که امروز به‌صورت دستی استفاده می‌شود را بنویسید.',
    },
    placeholder:
      'نمونه: میانگین زمان بارگذاری صفحهٔ تکلیف حدود ۸ ثانیه است (داشبورد گرافانا، تیر ۱۴۰۵) و نرخ خطای ارسال ۱۲٪ گزارش شده.',
  },
  {
    key: 'desiredState',
    label: 'وضعیت مطلوب',
    help: 'نتیجهٔ قابل مشاهده پس از اجرا، از دید کاربر یا ذی‌نفع. مراقب باشید این فیلد صرفاً نفیِ «وضعیت فعلی» نباشد — «دیگر کند نباشد» چیزی به تیم نمی‌گوید؛ «زیر ۲ ثانیه» می‌گوید.',
    perType: {
      bug: 'رفتار مورد انتظار چه بود؟',
      data: 'خروجی نهایی چه شکلی است؟ فیلدها، بازهٔ زمانی، تفکیک‌ها و دورهٔ به‌روزرسانی را بنویسید.',
    },
    placeholder:
      'نمونه: معلم بتواند تکلیف را در کمتر از ۲ ثانیه ارسال کند و نرخ خطای ارسال زیر ۱٪ باشد.',
  },
  {
    key: 'businessValue',
    label: 'ارزش کسب‌وکاری',
    help: 'چرا ارزش انجام دارد؟ هزینهٔ انجام‌ندادن چیست: ریزش کاربر، افت یک شاخص، کار دستی اضافه برای پشتیبانی، ریسک قانونی. اگر به یکی از OKRهای فصل وصل است، همان را نام ببرید.',
    perType: {
      tech: 'اگر انجام نشود، چه ریسکی متوجه ماست و با چه احتمالی؟',
      data: 'این داده قرار است چه تصمیمی را ممکن کند؟',
    },
    placeholder:
      'نمونه: با شروع سال تحصیلی، ادامهٔ کندی باعث ریزش معلمان فعال کلاسا و افت شاخص رضایت (NPS) می‌شود.',
  },
];

/** نکته‌های راهنما: مربوط به نوع انتخاب‌شده، و اگر چیزی انتخاب نشده همه */
function bulletsFor(
  perType: Partial<Record<RequestType, string>> | undefined,
  type: RequestType | null,
): string[] | undefined {
  if (!perType) return undefined;
  if (!type) return Object.values(perType);
  const one = perType[type];
  return one ? [one] : undefined;
}

export default function StepProblem({ state, dispatch }: Props) {
  return (
    <StepShell title="شرح مسئله">
      {FIELDS.map((f, i) => {
        // صورت‌مسئله همیشه الزامی است؛ بقیه بسته به نوع درخواست تغییر می‌کنند
        const gated: GatedField | null = f.key === 'problem' ? null : f.key;
        const skipped = gated !== null && !fieldEnabled(state, gated);
        const optional = gated !== null && !skipped && !fieldRequired(state, gated);
        return (
          <Field
            key={f.key}
            number={i + 1}
            label={f.label}
            help={f.help}
            helpBullets={bulletsFor(f.perType, state.requestType)}
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
            <CharCount value={state[f.key]} good={GOOD_LENGTH[f.key]} />
          </Field>
        );
      })}
    </StepShell>
  );
}
