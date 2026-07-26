import type { ReactNode } from 'react';
import HelpTip from './HelpTip';
import { toFaDigits } from '../lib/jalali';

interface Props {
  /** شمارهٔ سؤال در همین مرحله */
  number: number;
  label: string;
  /** متن راهنمای علامت سؤال — جایگزین توضیح زیر برچسب است */
  help?: string;
  /** نکته‌های وابسته به نوع درخواست، زیر متن راهنما */
  helpBullets?: string[];
  optional?: boolean;
  /** وقتی مسیر سریع این سؤال را غیرضروری می‌کند */
  disabled?: boolean;
  disabledNote?: string;
  /** برچسب کوچک کنار عنوان وقتی فیلد غیرفعال است (پیش‌فرض: «لازم نیست») */
  disabledLabel?: string;
  /** با انیمیشن ظاهر شود — برای فیلدهایی که مرحله‌به‌مرحله باز می‌شوند */
  reveal?: boolean;
  children: ReactNode;
}

/** شمارهٔ سؤال + برچسب + راهنمای «؟» + ورودی */
export default function Field({
  number,
  label,
  help,
  helpBullets,
  optional,
  disabled,
  disabledNote,
  disabledLabel = 'لازم نیست',
  reveal,
  children,
}: Props) {
  return (
    <div
      className={`field${disabled ? ' is-disabled' : ''}${reveal ? ' reveal' : ''}`}
    >
      <div className="field-label-row">
        <span className="field-number" aria-hidden>
          {toFaDigits(number)}
        </span>
        <span className="field-label">{label}</span>
        {help && <HelpTip text={help} bullets={helpBullets} label={label} />}
        {optional && !disabled && <span className="field-optional">اختیاری</span>}
        {disabled && <span className="field-skipped">{disabledLabel}</span>}
      </div>
      {disabled ? (
        <p className="field-disabled-note">{disabledNote}</p>
      ) : (
        children
      )}
    </div>
  );
}
