'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type Status = 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED';

/** ویرایش ادمینی چک‌این (هفته‌های گذشته برای تیم قفل‌اند) — با فلگ «ویرایش‌شده» ثبت می‌شود */
export function CheckinEditForm({
  checkInId,
  metricType,
  initial,
}: {
  checkInId: string;
  metricType: 'NUMERIC' | 'BOOLEAN' | 'TEXT';
  initial: {
    currentValue: number | null;
    booleanValue: boolean | null;
    textValue: string | null;
    progressStatus: Status;
    blockerDescription: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(initial.currentValue?.toString() ?? '');
  const [booleanValue, setBooleanValue] = useState(
    initial.booleanValue === true ? 'yes' : initial.booleanValue === false ? 'no' : ''
  );
  const [textValue, setTextValue] = useState(initial.textValue ?? '');
  const [status, setStatus] = useState<Status>(initial.progressStatus);
  const [blocker, setBlocker] = useState(initial.blockerDescription ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/admin/checkins/${checkInId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentValue: metricType === 'NUMERIC' && currentValue.trim() !== '' ? Number(currentValue) : undefined,
        booleanValue: metricType === 'BOOLEAN' && booleanValue !== '' ? booleanValue === 'yes' : undefined,
        textValue: metricType === 'TEXT' ? textValue || null : undefined,
        progressStatus: status,
        blockerDescription: blocker || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? 'خطا در ذخیره');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setOpen(true)}>
        ✎ ویرایش ادمینی
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-amber-400 bg-amber-50/50 p-2">
      {metricType === 'NUMERIC' && (
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">مقدار</label>
          <Input dir="ltr" className="h-9 w-28" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
        </div>
      )}
      {metricType === 'BOOLEAN' && (
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">بله/خیر</label>
          <Select className="h-9 w-24" value={booleanValue} onChange={(e) => setBooleanValue(e.target.value)}>
            <option value="">—</option>
            <option value="yes">بله</option>
            <option value="no">خیر</option>
          </Select>
        </div>
      )}
      {metricType === 'TEXT' && (
        <div className="min-w-48 flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">گزارش</label>
          <Input className="h-9" value={textValue} onChange={(e) => setTextValue(e.target.value)} />
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">وضعیت</label>
        <Select className="h-9 w-28" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="ON_TRACK">در مسیر</option>
          <option value="AT_RISK">در ریسک</option>
          <option value="BLOCKED">بلاک‌شده</option>
          <option value="COMPLETED">تکمیل‌شده</option>
        </Select>
      </div>
      <div className="min-w-36">
        <label className="mb-1 block text-xs text-muted-foreground">بلاکر</label>
        <Input className="h-9" value={blocker} onChange={(e) => setBlocker(e.target.value)} />
      </div>
      <Button size="sm" onClick={save} disabled={busy}>
        {busy ? '…' : 'ذخیره ویرایش'}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        انصراف
      </Button>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}
