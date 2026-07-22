import type { ReactNode } from 'react';

interface Props {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

/** برچسب + راهنمای ریز + ورودی */
export default function Field({ label, hint, optional, children }: Props) {
  return (
    <div className="field">
      <div className="field-label-row">
        <span className="field-label">{label}</span>
        {optional && <span className="field-optional">اختیاری</span>}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
      {children}
    </div>
  );
}
