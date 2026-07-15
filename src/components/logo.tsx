'use client';

import { useState } from 'react';

/**
 * لوگوی شاد: اول public/logo.png را امتحان می‌کند (فایل اصلی سازمان را با این نام
 * در پوشه public بگذارید)؛ اگر نبود از بازسازی SVG استفاده می‌کند.
 */
export function Logo({ className }: { className?: string }) {
  const [src, setSrc] = useState('/logo.png');
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="شاد — مدرسه‌ای به وسعت ایران"
      className={className}
      onError={() => {
        if (src === '/logo.png') setSrc('/logo.svg');
        else setHidden(true);
      }}
    />
  );
}
