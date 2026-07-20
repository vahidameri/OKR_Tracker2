'use client';

import * as jalaali from 'jalaali-js';
import { useEffect } from 'react';
import { Select } from '@/components/ui/select';
import { ALL_CYCLES, periodLabel } from '@/lib/period';

/** دوره‌ی فصل جاری بر اساس تاریخ امروز، مثل «Q2-1405» */
export function currentPeriod(): string {
  const now = new Date();
  const { jy, jm } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `Q${Math.ceil(jm / 3)}-${jy}`;
}

/** گزینه‌های دوره: فصل‌های سال قبل تا سال بعد + کل سال، همراه با گزینه‌ی «همه‌ی دوره‌ها» */
function buildOptions(): { value: string; label: string }[] {
  const now = new Date();
  const { jy } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const options: { value: string; label: string }[] = [];
  for (const year of [jy - 1, jy, jy + 1]) {
    for (let q = 1; q <= 4; q++) {
      const value = `Q${q}-${year}`;
      options.push({ value, label: periodLabel(value) });
    }
    options.push({ value: `${year}`, label: periodLabel(`${year}`) });
  }
  return options;
}

export function PeriodSelect({
  value,
  onChange,
  includeAll = false,
}: {
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean;
}) {
  const options = buildOptions();

  // شناسایی خودکار فصل جاری: اگر مقداری انتخاب نشده، پیش‌فرض فصل جاری
  useEffect(() => {
    if (!value) onChange(currentPeriod());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const known = options.some((o) => o.value === value) || value === ALL_CYCLES;
  const current = currentPeriod();

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      {includeAll && <option value={ALL_CYCLES}>{periodLabel(ALL_CYCLES)}</option>}
      {!known && value && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
          {o.value === current ? ' — فصل جاری' : ''}
        </option>
      ))}
    </Select>
  );
}
