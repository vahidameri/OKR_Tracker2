import { len } from '../lib/limits';
import { toFaDigits } from '../lib/jalali';

interface Props {
  value: string;
  min: number;
}

/** شمارندهٔ زندهٔ کاراکتر با حداقل لازم */
export default function CharCount({ value, min }: Props) {
  const n = len(value);
  const ok = n >= min;
  return (
    <p className={`char-count${ok ? ' ok' : n > 0 ? ' short' : ''}`} aria-live="polite">
      {ok
        ? `${toFaDigits(n)} کاراکتر`
        : `${toFaDigits(n)} از دست‌کم ${toFaDigits(min)} کاراکتر`}
    </p>
  );
}
