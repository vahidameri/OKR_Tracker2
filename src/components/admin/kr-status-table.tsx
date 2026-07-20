'use client';

import { useState } from 'react';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import type { AutoStatus, ProgressStatusValue } from '@/lib/report-types';

export interface KrStatusRow {
  id: string;
  teamId: string;
  teamName: string;
  objectiveTitle: string;
  krTitle: string;
  metricLabel: string;
  targetLabel: string;
  valueLabel: string;
  progress: number;
  recordedStatus: ProgressStatusValue | null;
  autoStatus: AutoStatus | null;
  expected: number | null;
}

/** جدول آخرین وضعیت KRها با فیلتر تیمی چک‌باکسی (تیک هر تیم = نمایش/مخفی) */
export function KrStatusTable({
  rows,
  teams,
}: {
  rows: KrStatusRow[];
  teams: { id: string; name: string }[];
}) {
  const [active, setActive] = useState<Set<string>>(new Set(teams.map((t) => t.id)));

  const toggle = (id: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allOn = active.size === teams.length;
  const visible = rows.filter((r) => active.has(r.teamId));

  return (
    <div className="space-y-3">
      {/* فیلتر تیم‌ها */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActive(allOn ? new Set() : new Set(teams.map((t) => t.id)))}
          className="rounded-lg border border-border bg-card px-3 py-1 text-xs font-bold hover:bg-muted"
        >
          {allOn ? 'برداشتن همه' : 'انتخاب همه'}
        </button>
        {teams.map((t) => {
          const on = active.has(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                on ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border ${
                  on ? 'border-primary bg-primary text-white' : 'border-border'
                }`}
              >
                {on && '✓'}
              </span>
              {t.name}
            </button>
          );
        })}
      </div>

      <Table>
        <THead>
          <TR>
            <TH>تیم</TH>
            <TH>هدف</TH>
            <TH>نتیجه کلیدی</TH>
            <TH>نوع</TH>
            <TH>تارگت</TH>
            <TH>آخرین مقدار</TH>
            <TH>پیشرفت</TH>
            <TH>وضعیت ثبت‌شده</TH>
            <TH>وضعیت زمانی</TH>
          </TR>
        </THead>
        <TBody>
          {visible.map((r) => (
            <TR key={r.id}>
              <TD>{r.teamName}</TD>
              <TD className="max-w-40 text-xs">{r.objectiveTitle}</TD>
              <TD className="max-w-52 text-xs">{r.krTitle}</TD>
              <TD className="text-xs">{r.metricLabel}</TD>
              <TD className="text-xs">{r.targetLabel}</TD>
              <TD className="text-xs">{r.valueLabel}</TD>
              <TD className="font-bold">{r.progress}٪</TD>
              <TD>{r.recordedStatus ? <StatusBadge status={r.recordedStatus} /> : '—'}</TD>
              <TD>
                <AutoStatusBadge status={r.autoStatus} expected={r.expected} />
              </TD>
            </TR>
          ))}
          {visible.length === 0 && (
            <TR>
              <TD colSpan={9} className="py-6 text-center text-muted-foreground">
                هیچ تیمی انتخاب نشده است.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
