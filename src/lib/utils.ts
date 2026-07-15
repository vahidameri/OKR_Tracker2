import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** فرمت عدد با جداکننده هزارگان فارسی */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fa-IR').format(value);
}

/** نمایش خلاصه عدد (هزار/میلیون/میلیارد) */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${formatNumber(+(value / 1_000_000_000).toFixed(2))} میلیارد`;
  if (abs >= 1_000_000) return `${formatNumber(+(value / 1_000_000).toFixed(2))} میلیون`;
  if (abs >= 1_000) return `${formatNumber(+(value / 1_000).toFixed(1))} هزار`;
  return formatNumber(value);
}
