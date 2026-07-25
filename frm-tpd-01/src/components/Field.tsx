import type { ReactNode } from 'react';
import HelpTip from './HelpTip';
import { toFaDigits } from '../lib/jalali';

interface Props {
  /** شمارهٔ سؤال در همین مرحله */
  number: number;
  label: string;
  /** متن راهنمای علامت سؤال — جایگزین توضیح زیر برچسب است */
  help?: string;
  optional?: boolean;
  /** وقتی مسیر سریع این سؤال را غیرضروری می‌کند */
  disabled?: boolean;
  disabledNote?: string;
  children: ReactNode;
}

/** شمارهٔ سؤال + برچسب + راهنمای «؟» + ورودی */
export default function Field({
  number,
  label,
  help,
  optional,
  disabled,
  disabledNote,
  children,
}: Props) {
  return (
    <div className={`field${disabled ? ' is-disabled' : ''}`}>
      <div className="field-label-row">
        <span className="field-number" aria-hidden>
          {toFaDigits(number)}
        </span>
        <span className="field-label">{label}</span>
        {help && <HelpTip text={help} label={label} />}
        {optional && !disabled && <span className="field-optional">اختیاری</span>}
        {disabled && <span className="field-skipped">لازم نیست</span>}
      </div>
      {disabled ? (
        <p className="field-disabled-note">{disabledNote}</p>
      ) : (
        children
      )}
    </div>
  );
}
