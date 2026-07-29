'use client';

import { useEffect, useState } from 'react';
import { formatJalaliLong } from '@/lib/jalali';

/** ساعت و تاریخ زندهٔ امروز (شمسی) — برای نمایش در سایدبار */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // تا قبل از mount چیزی رندر نکن تا hydration mismatch رخ ندهد
  if (!now) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  return (
    <span className={className}>
      {formatJalaliLong(now)} · <span dir="ltr">{time}</span>
    </span>
  );
}
