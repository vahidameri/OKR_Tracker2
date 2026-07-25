import { len } from '../lib/limits';
import { toFaDigits } from '../lib/jalali';

interface Props {
  value: string;
  /** طول پیشنهادی برای گرفتن امتیاز کامل این محور */
  good: number;
}

/**
 * شمارندهٔ زندهٔ کاراکتر. طول پیشنهادی اجباری نیست؛ فقط نشان می‌دهد از کجا
 * پاسخ برای امتیاز آمادگی کامل حساب می‌شود.
 */
export default function CharCount({ value, good }: Props) {
  const n = len(value);
  if (n === 0) return null;
  const ok = n >= good;
  return (
    <p className={`char-count${ok ? ' ok' : ' short'}`} aria-live="polite">
      {ok
        ? `${toFaDigits(n)} کاراکتر`
        : `${toFaDigits(n)} کاراکتر · از ${toFaDigits(good)} کاراکتر امتیاز کامل می‌گیرد`}
    </p>
  );
}
