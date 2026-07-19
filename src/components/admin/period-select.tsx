'use client';

import * as jalaali from 'jalaali-js';
import { Select } from '@/components/ui/select';
import { SEASON_NAMES } from '@/lib/jalali';

/** گزینه‌های دوره: فصل‌های سال قبل تا سال بعد + سال کامل — با مقدار استاندارد Q2-1405 */
function buildOptions(): { value: string; label: string }[] {
  const now = new Date();
  const { jy } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const options: { value: string; label: string }[] = [];
  for (const year of [jy - 1, jy, jy + 1]) {
    for (let q = 1; q <= 4; q++) {
      options.push({ value: `Q${q}-${year}`, label: `${SEASON_NAMES[q - 1]} ${year} (Q${q})` });
    }
    options.push({ value: `${year}`, label: `کل سال ${year}` });
  }
  return options;
}

export function PeriodSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = buildOptions();
  const known = options.some((o) => o.value === value);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>
        انتخاب دوره…
      </option>
      {!known && value && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
