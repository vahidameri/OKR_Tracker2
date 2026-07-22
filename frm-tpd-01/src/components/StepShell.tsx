import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** قاب مشترک هر مرحله: عنوان بزرگ + توضیح کوتاه + محتوا */
export default function StepShell({ title, subtitle, children }: Props) {
  return (
    <section className="step-shell">
      <h1 className="step-title">{title}</h1>
      {subtitle && <p className="step-subtitle">{subtitle}</p>}
      <div className="step-body">{children}</div>
    </section>
  );
}
