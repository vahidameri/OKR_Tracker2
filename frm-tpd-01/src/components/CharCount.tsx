import { len } from '../lib/limits';
import { toFaDigits } from '../lib/jalali';

interface Props {
  value: string;
  /** طول پیشنهادی برای گرفتن امتیاز کامل این محور */
  good: number;
}

/**
 * شمارندهٔ زندهٔ کاراکتر. هیچ حد و حدودی اعلام نمی‌کند؛ فقط طول پاسخ را
 * نشان می‌دهد و رنگش از روی طول پیشنهادیِ امتیاز آمادگی تعیین می‌شود.
 */
export default function CharCount({ value, good }: Props) {
  const n = len(value);
  if (n === 0) return null;
  const ok = n >= good;
  return (
    <p className={`char-count${ok ? ' ok' : ' short'}`} aria-live="polite">
      {toFaDigits(n)} کاراکتر
    </p>
  );
}
