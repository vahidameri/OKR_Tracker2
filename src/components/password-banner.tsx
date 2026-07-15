'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/** بنر پیشنهاد تغییر پسورد اولیه — قابل رد کردن («بعداً») و غیراجباری */
export function PasswordBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem('pw-banner-dismissed') === '1');
  }, []);

  if (!session?.user?.mustChangePassword || dismissed) return null;

  return (
    <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span>🔑 هنوز از پسورد اولیه استفاده می‌کنید. برای امنیت بیشتر آن را تغییر دهید.</span>
      <span className="flex gap-2">
        <Link href="/settings" className="rounded-md bg-amber-600 px-3 py-1 font-medium text-white hover:bg-amber-700">
          تغییر پسورد
        </Link>
        <button
          onClick={() => {
            sessionStorage.setItem('pw-banner-dismissed', '1');
            setDismissed(true);
          }}
          className="rounded-md border border-amber-400 px-3 py-1 hover:bg-amber-100"
        >
          بعداً
        </button>
      </span>
    </div>
  );
}
