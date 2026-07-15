import Link from 'next/link';
import { cn } from '@/lib/utils';

/** سوییچ بین نمای کارتی و جدولی در صفحات لیستینگ (بر پایه‌ی پارامتر view در URL) */
export function ViewToggle({
  view,
  hrefCards,
  hrefTable,
}: {
  view: 'cards' | 'table';
  hrefCards: string;
  hrefTable: string;
}) {
  const base = 'rounded-md px-3 py-1.5 text-sm transition-colors';
  return (
    <div className="no-print inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <Link
        href={hrefCards}
        className={cn(base, view === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
      >
        ▦ کارتی
      </Link>
      <Link
        href={hrefTable}
        className={cn(base, view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
      >
        ☰ جدولی
      </Link>
    </div>
  );
}
