import * as React from 'react';
import { ProgressStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import {
  AUTO_STATUS_LABELS,
  AUTO_STATUS_STYLES,
  STATUS_LABELS,
  type AutoStatus,
} from '@/lib/progress';

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        // whitespace-nowrap تا بج‌ها همیشه تک‌خطی و هم‌اندازه بمانند و متن‌ها هم‌راستا شوند
        'inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-bold',
        className
      )}
      {...props}
    />
  );
}

// پالت یکدست وضعیت: در مسیر=فیروزه‌ای، ریسک=کهربایی، بلاک=قرمز، تکمیل=سبز (۱۰۰٪)
const statusStyles: Record<ProgressStatus, { badge: string; dot: string }> = {
  ON_TRACK: { badge: 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-600/20', dot: 'bg-teal-500' },
  AT_RISK: { badge: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/25', dot: 'bg-amber-500' },
  BLOCKED: { badge: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/25', dot: 'bg-red-500' },
  COMPLETED: { badge: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/25', dot: 'bg-emerald-500' },
};

export function StatusBadge({ status }: { status: ProgressStatus }) {
  const s = statusStyles[status];
  return (
    <Badge className={cn('gap-1.5', s.badge)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function AutoStatusBadge({
  status,
  expected,
}: {
  status: AutoStatus | null;
  expected?: number | null;
}) {
  if (!status) return null;
  return (
    <Badge
      className={AUTO_STATUS_STYLES[status]}
      title={
        expected !== null && expected !== undefined
          ? `وضعیت خودکار بر اساس زمان: انتظار ${expected}٪ پیشرفت تا امروز`
          : 'وضعیت خودکار بر اساس زمان سپری‌شده از دوره'
      }
    >
      ⏱ {AUTO_STATUS_LABELS[status]}
    </Badge>
  );
}
