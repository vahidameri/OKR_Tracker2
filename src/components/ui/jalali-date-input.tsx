'use client';

import * as jalaali from 'jalaali-js';
import { Input } from '@/components/ui/input';

const JMONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/** تبدیل تاریخ ISO (میلادی) به سه بخش شمسی */
function isoToJalali(iso: string): { jy: string; jm: string; jd: string } {
  if (!iso) return { jy: '', jm: '', jd: '' };
  const d = new Date(iso);
  const { jy, jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { jy: String(jy), jm: String(jm), jd: String(jd) };
}

/** ورودی تاریخ شمسی (روز/ماه/سال) که مقدار ISO میلادی برمی‌گرداند */
export function JalaliDateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const { jy, jm, jd } = isoToJalali(value);

  function update(part: 'jy' | 'jm' | 'jd', raw: string) {
    const next = { jy: Number(jy) || 0, jm: Number(jm) || 0, jd: Number(jd) || 0 };
    next[part] = Number(raw) || 0;
    if (next.jy >= 1300 && next.jm >= 1 && next.jm <= 12 && next.jd >= 1 && next.jd <= 31) {
      const g = jalaali.toGregorian(next.jy, next.jm, next.jd);
      onChange(new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).toISOString());
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        placeholder="روز"
        className="w-16 text-center"
        value={jd}
        onChange={(e) => update('jd', e.target.value)}
      />
      <select
        className="h-10 rounded-md border border-border bg-card px-2 text-sm"
        value={jm}
        onChange={(e) => update('jm', e.target.value)}
      >
        <option value="">ماه</option>
        {JMONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <Input
        type="number"
        placeholder="سال"
        className="w-20 text-center"
        value={jy}
        onChange={(e) => update('jy', e.target.value)}
      />
    </div>
  );
}
