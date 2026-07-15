import * as React from 'react';
import { ProgressStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { STATUS_LABELS } from '@/lib/progress';

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
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
