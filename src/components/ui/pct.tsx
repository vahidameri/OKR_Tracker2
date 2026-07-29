import { cn } from '@/lib/utils';

/**
 * نمایش درصد به سبک فارسی: علامت ٪ سمت چپِ عدد («٪۲۶»).
 * از dir="ltr" استفاده می‌کنیم تا ترتیب علامت و عدد قطعی و ثابت بماند.
 */
export function Pct({ value, className }: { value: number; className?: string }) {
  return (
    <span dir="ltr" className={cn('tabular-nums', className)}>
      ٪{value}
    </span>
  );
}

/**
 * نمایش عددِ علامت‌دار (+/−) با علامت سمت چپ عدد، به‌صورت قطعی.
 */
export function Signed({ value, className }: { value: number; className?: string }) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return (
    <span dir="ltr" className={cn('tabular-nums', className)}>
      {sign}
      {Math.abs(value)}
    </span>
  );
}
