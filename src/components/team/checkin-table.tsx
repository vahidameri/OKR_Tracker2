'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { formatCompact } from '@/lib/utils';

type Status = 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED';

export interface CheckinTableRow {
  teamKeyResultId: string;
  objectiveTitle: string;
  krTitle: string;
  isShared: boolean;
  metricType: 'NUMERIC' | 'BOOLEAN' | 'TEXT';
  unit: string | null;
  weight: number;
  target: number | null;
  existing: {
    currentValue: number | null;
    booleanValue: boolean | null;
    textValue: string | null;
    progressStatus: Status;
    blockerDescription: string | null;
  } | null;
}

function Row({ row }: { row: CheckinTableRow }) {
  const router = useRouter();
  const [currentValue, setCurrentValue] = useState(row.existing?.currentValue?.toString() ?? '');
  const [booleanValue, setBooleanValue] = useState<string>(
    row.existing?.booleanValue === true ? 'yes' : row.existing?.booleanValue === false ? 'no' : ''
  );
  const [textValue, setTextValue] = useState(row.existing?.textValue ?? '');
  const [status, setStatus] = useState<Status>(row.existing?.progressStatus ?? 'ON_TRACK');
  const [blocker, setBlocker] = useState(row.existing?.blockerDescription ?? '');
  const [state, setState] = useState<'idle' | 'busy' | 'saved' | 'error'>(row.existing ? 'saved' : 'idle');
  const [error, setError] = useState('');

  async function save() {
    setError('');
    const numeric = currentValue.trim() === '' ? null : Number(currentValue.replace(/[,،\s]/g, ''));
    if (row.metricType === 'NUMERIC' && (numeric === null || !Number.isFinite(numeric)))
      return setError('عدد معتبر وارد کنید');
    if (row.metricType === 'BOOLEAN' && booleanValue === '') return setError('بله/خیر را انتخاب کنید');
    if (row.metricType === 'TEXT' && !textValue.trim()) return setError('متن گزارش الزامی است');
    if (status === 'BLOCKED' && !blocker.trim()) return setError('توضیح بلاکر الزامی است');

    setState('busy');
    const res = await fetch('/api/team/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamKeyResultId: row.teamKeyResultId,
        currentValue: numeric,
        booleanValue: booleanValue === '' ? null : booleanValue === 'yes',
        textValue: textValue || null,
        progressStatus: status,
        blockerDescription: blocker || null,
      }),
    });
    if (!res.ok) {
      setState('error');
      setError((await res.json()).error ?? 'خطا در ثبت');
      return;
    }
    setState('saved');
    router.refresh();
  }

  return (
    <TR>
      <TD className="max-w-52">
        <p className="text-sm font-medium">{row.krTitle}</p>
        <p className="text-xs text-muted-foreground">
          {row.objectiveTitle}
          {row.isShared && <span className="mr-1 text-violet-600">(مشترک)</span>}
        </p>
      </TD>
      <TD className="text-xs">
        {row.metricType === 'NUMERIC' ? `${formatCompact(row.target)} ${row.unit ?? ''}` : '—'}
      </TD>
      <TD>
        {row.metricType === 'NUMERIC' && (
          <Input
            dir="ltr"
            inputMode="numeric"
            className="h-9 w-28"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
          />
        )}
        {row.metricType === 'BOOLEAN' && (
          <Select className="h-9 w-24" value={booleanValue} onChange={(e) => setBooleanValue(e.target.value)}>
            <option value="">—</option>
            <option value="yes">بله</option>
            <option value="no">خیر</option>
          </Select>
        )}
        {row.metricType === 'TEXT' && (
          <Input className="h-9 w-40" value={textValue} onChange={(e) => setTextValue(e.target.value)} />
        )}
      </TD>
      <TD>
        <Select className="h-9 w-32" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="ON_TRACK">در مسیر</option>
          <option value="AT_RISK">در ریسک</option>
          <option value="BLOCKED">بلاک‌شده</option>
          <option value="COMPLETED">تکمیل‌شده</option>
        </Select>
      </TD>
      <TD>
        <Input className="h-9 w-36" placeholder="بلاکر (اختیاری)" value={blocker} onChange={(e) => setBlocker(e.target.value)} />
      </TD>
      <TD>
        <div className="flex flex-col gap-1">
          <Button size="sm" onClick={save} disabled={state === 'busy'}>
            {state === 'busy' ? '…' : state === 'saved' ? 'به‌روزرسانی ✔' : 'ثبت'}
          </Button>
          {error && <span className="max-w-36 text-xs text-destructive">{error}</span>}
        </div>
      </TD>
    </TR>
  );
}

export function CheckinTable({ rows }: { rows: CheckinTableRow[] }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>نتیجه کلیدی</TH>
          <TH>تارگت</TH>
          <TH>مقدار این هفته</TH>
          <TH>وضعیت</TH>
          <TH>بلاکر</TH>
          <TH>ثبت</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((row) => (
          <Row key={row.teamKeyResultId} row={row} />
        ))}
      </TBody>
    </Table>
  );
}
