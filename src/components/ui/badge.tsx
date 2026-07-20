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

const statusStyles: Record<ProgressStatus, string> = {
  ON_TRACK: 'bg-emerald-100 text-emerald-800',
  AT_RISK: 'bg-amber-100 text-amber-800',
  BLOCKED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export function StatusBadge({ status }: { status: ProgressStatus }) {
  return <Badge className={statusStyles[status]}>{STATUS_LABELS[status]}</Badge>;
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
