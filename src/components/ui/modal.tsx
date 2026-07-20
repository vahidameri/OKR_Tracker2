'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

/** مودال ساده به سبک مرجع: اورلی تیره + پنل سفید گرد + دکمه بستن */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative max-h-[88vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" title="بستن">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
