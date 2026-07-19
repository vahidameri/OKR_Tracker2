'use client';

import { useEffect, useState } from 'react';

/**
 * لوگوی شاد: پیش‌فرض بازسازی SVG داخلی؛ اگر فایل اصلی public/logo.png موجود باشد،
 * پس از بارگذاری صفحه خودکار جایگزین می‌شود (بدون ریسک خطای هیدریشن).
 */
export function Logo({ className }: { className?: string }) {
  const [src, setSrc] = useState('/logo.svg');

  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setSrc('/logo.png');
    probe.src = '/logo.png';
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="شاد" className={className} />
  );
}
