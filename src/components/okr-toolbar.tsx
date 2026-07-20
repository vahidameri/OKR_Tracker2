'use client';

import { LayoutGrid, List, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'وضعیت: همه' },
  { value: 'ON_TRACK', label: 'در مسیر' },
  { value: 'AT_RISK', label: 'در ریسک' },
  { value: 'BLOCKED', label: 'بلاک‌شده' },
  { value: 'COMPLETED', label: 'تکمیل‌شده' },
  { value: 'NONE', label: 'بدون چک‌این' },
];

/**
 * نوار ابزار OKR به سبک مرجع: سوییچ کارتی/جدولی + فیلتر وضعیت + جستجو.
 * فیلترها در query string اعمال می‌شوند تا سرور همان‌ها را فیلتر کند.
 */
export function OkrToolbar({ view }: { view: 'cards' | 'table' }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  // debounce جستجو
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== q) setParam('q', q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const status = params.get('status') ?? '';
  const toggleBase = 'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setParam('view', '')}
          className={cn(toggleBase, view === 'cards' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted')}
        >
          <LayoutGrid className="h-4 w-4" /> کارتی
        </button>
        <button
          onClick={() => setParam('view', 'table')}
          className={cn(toggleBase, view === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted')}
        >
          <List className="h-4 w-4" /> جدولی
        </button>
      </div>

      <select
        value={status}
        onChange={(e) => setParam('status', e.target.value)}
        className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <div className="relative min-w-52 flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی هدف یا نتیجه کلیدی…"
          className="h-9 w-full rounded-lg border border-border bg-card pr-9 pl-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>
    </div>
  );
}
