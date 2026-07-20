'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/select';
import { ALL_CYCLES, periodLabel } from '@/lib/period';

interface CycleOption {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

/**
 * انتخابگر دوره: فقط دوره‌های فعالِ تعریف‌شده توسط ادمین را نشان می‌دهد.
 * اگر دوره‌ای تعریف نشده باشد، پیام راهنما نمایش داده می‌شود.
 */
export function PeriodSelect({
  value,
  onChange,
  includeAll = false,
}: {
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean;
}) {
  const [cycles, setCycles] = useState<CycleOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/cycles')
      .then((r) => r.json())
      .then((data: CycleOption[]) => {
        setCycles(data);
        setLoaded(true);
        // پیش‌فرض: اولین دوره‌ی فعال (جدیدترین)
        if (!value && data.length > 0) onChange(data[0].name);
      })
      .catch(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loaded && cycles.length === 0) {
    return (
      <p className="text-xs text-amber-700">
        هیچ دوره‌ای تعریف نشده — ابتدا از «تعریف دوره‌ها» یک دوره بسازید.
      </p>
    );
  }

  const known = cycles.some((c) => c.name === value) || value === ALL_CYCLES;

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      {includeAll && <option value={ALL_CYCLES}>{periodLabel(ALL_CYCLES)}</option>}
      {!known && value && <option value={value}>{value}</option>}
      {cycles.map((c) => (
        <option key={c.id} value={c.name}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}
