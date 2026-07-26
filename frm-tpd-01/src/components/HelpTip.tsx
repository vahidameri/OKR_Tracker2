import { useEffect, useId, useRef, useState } from 'react';

interface Props {
  /** توضیح ساده و مشخص دربارهٔ این سؤال */
  text: string;
  /** نکته‌های ویژهٔ نوع درخواستِ انتخاب‌شده، زیر متن اصلی */
  bullets?: string[];
  /** برای برچسب دسترس‌پذیری: راهنمای «…» */
  label: string;
}

/** علامت سؤال کنار هر سؤال؛ با کلیک یک توضیح کوتاه نشان می‌دهد */
export default function HelpTip({ text, bullets, label }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  // بستن با کلیک بیرون یا کلید Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="helptip" ref={rootRef}>
      <button
        type="button"
        className={`helptip-btn${open ? ' open' : ''}`}
        tabIndex={-1}
        aria-label={`راهنمای ${label}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        ؟
      </button>
      {open && (
        <span className="helptip-popover" id={id} role="note">
          {text}
          {bullets && bullets.length > 0 && (
            <ul className="helptip-list">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </span>
      )}
    </span>
  );
}
