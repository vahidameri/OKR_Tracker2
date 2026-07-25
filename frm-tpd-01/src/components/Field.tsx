import type { ReactNode } from 'react';
import HelpTip from './HelpTip';
import { toFaDigits } from '../lib/jalali';

interface Props {
  /** شمارهٔ سؤال در همین مرحله */
  number: number;
  label: string;
  hint?: string;
  /** متن راهنمای علامت سؤال */
  help?: string;
  optional?: boolean;
  children: ReactNode;
}

/** شمارهٔ سؤال + برچسب + راهنمای «؟» + راهنمای ریز + ورودی */
export default function Field({
  number,
  label,
  hint,
  help,
  optional,
  children,
}: Props) {
  return (
    <div className="field">
      <div className="field-label-row">
        <span className="field-number" aria-hidden>
          {toFaDigits(number)}
        </span>
        <span className="field-label">{label}</span>
        {help && <HelpTip text={help} label={label} />}
        {optional && <span className="field-optional">اختیاری</span>}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
      {children}
    </div>
  );
}
