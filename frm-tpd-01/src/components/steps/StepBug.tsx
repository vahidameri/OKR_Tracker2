import StepShell from '../StepShell';
import ChipGroup from '../ChipGroup';
import Field from '../Field';
import CharCount from '../CharCount';
import type { Action, FormState } from '../../state';
import { SEVERITIES } from '../../state';
import { GOOD_LENGTH } from '../../lib/limits';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

/**
 * مرحلهٔ اختصاصی باگ — فقط وقتی نوع درخواست «رفع اشکال» باشد.
 * عمداً کوتاه است: گام‌های بازتولید و رفتار مشاهده‌شده در «وضعیت فعلی» و
 * رفتار مورد انتظار در «وضعیت مطلوب» نوشته می‌شود، پس اینجا فقط چیزهایی
 * می‌آید که جای دیگری پرسیده نمی‌شوند.
 */
export default function StepBug({ state, dispatch }: Props) {
  return (
    <StepShell
      title="جزئیات باگ"
      subtitle="دو چیزی که برای بازتولید و اولویت‌گذاری باگ لازم است"
    >
      <Field
        number={1}
        label="محیط، نسخه و دستگاه"
        help="باگ روی چه چیزی دیده شده است؟ هرچه دقیق‌تر، تیم فنی سریع‌تر بازتولیدش می‌کند: نام و نسخهٔ اپ یا مرورگر، سیستم‌عامل و نسخه‌اش، مدل دستگاه، و اینکه روی شبکهٔ داخلی بوده یا اینترنت. اگر روی چند محیط تست کرده‌اید و فقط روی یکی رخ می‌دهد، همان را بنویسید — این خودش نصف تشخیص است."
      >
        <textarea
          className="text-area"
          rows={3}
          value={state.bugEnv}
          placeholder="نمونه: اپ شاد اندروید نسخهٔ ۴٫۲٫۱، شیائومی Redmi Note 12، اندروید ۱۳ — روی وب و iOS تکرار نشد."
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { bugEnv: e.target.value } })
          }
        />
        <CharCount value={state.bugEnv} good={GOOD_LENGTH.bugEnv} />
      </Field>

      <Field
        number={2}
        label="شدت و دامنهٔ اثر"
        help="برای باگ، جای «ارزش کسب‌وکاری» را این فیلد می‌گیرد: چقدر از کار کاربر مختل شده و چند نفر درگیرند. «بالا» وقتی است که مسیر اصلی از کار افتاده و هیچ راه دور زدنی وجود ندارد؛ اگر راه جایگزینی هست، «متوسط» است. این با «اولویت» فرق دارد — اولویت را در مرحلهٔ بعد جدا می‌پرسیم."
      >
        <ChipGroup
          ariaLabel="شدت و دامنهٔ اثر"
          columns={3}
          options={SEVERITIES}
          value={state.bugSeverity}
          onChange={(bugSeverity) => dispatch({ type: 'patch', patch: { bugSeverity } })}
        />
      </Field>
    </StepShell>
  );
}
