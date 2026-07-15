'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MilestoneChecklist, type MilestoneItem } from '@/components/team/milestone-checklist';
import { formatCompact } from '@/lib/utils';

export interface CheckInFormProps {
  teamKeyResultId: string;
  metricType: 'NUMERIC' | 'BOOLEAN' | 'TEXT';
  unit: string | null;
  milestones?: MilestoneItem[];
  existing: {
    currentValue: number | null;
    booleanValue: boolean | null;
    textValue: string | null;
    progressStatus: 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED';
    blockerDescription: string | null;
  } | null;
}

export function CheckInForm({ teamKeyResultId, metricType, unit, milestones = [], existing }: CheckInFormProps) {
  const router = useRouter();
  const [currentValue, setCurrentValue] = useState(existing?.currentValue?.toString() ?? '');
  const [booleanValue, setBooleanValue] = useState<boolean | null>(existing?.booleanValue ?? null);
  const [textValue, setTextValue] = useState(existing?.textValue ?? '');
  const [progressStatus, setProgressStatus] = useState(existing?.progressStatus ?? 'ON_TRACK');
  const [blockerDescription, setBlockerDescription] = useState(existing?.blockerDescription ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existing);

  const numericValue = currentValue.trim() === '' ? null : Number(currentValue.replace(/[,،\s]/g, ''));

  const hasMilestones = metricType === 'BOOLEAN' && milestones.length > 0;

  async function submit() {
    setError('');
    if (metricType === 'NUMERIC' && (numericValue === null || !Number.isFinite(numericValue))) {
      return setError('مقدار عددی معتبر وارد کنید.');
    }
    if (metricType === 'BOOLEAN' && !hasMilestones && booleanValue === null) {
      return setError('بله یا خیر را انتخاب کنید.');
    }
    if (metricType === 'TEXT' && !textValue.trim()) {
      return setError('متن گزارش را بنویسید.');
    }
    if (progressStatus === 'BLOCKED' && !blockerDescription.trim()) {
      return setError('برای وضعیت بلاک‌شده، توضیح بلاکر الزامی است.');
    }

    setSaving(true);
    const res = await fetch('/api/team/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamKeyResultId,
        currentValue: numericValue,
        booleanValue,
        textValue: textValue || null,
        progressStatus,
        blockerDescription: blockerDescription || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error ?? 'خطا در ثبت');
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {metricType === 'NUMERIC' && (
        <div>
          <Label>مقدار فعلی {unit ? `(${unit})` : ''}</Label>
          <Input dir="ltr" inputMode="numeric" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
          {numericValue !== null && Number.isFinite(numericValue) && (
            <p className="mt-1 text-xs text-muted-foreground">= {formatCompact(numericValue)} {unit ?? ''}</p>
          )}
        </div>
      )}

      {metricType === 'BOOLEAN' && (
        <div className="space-y-3">
          <MilestoneChecklist teamKeyResultId={teamKeyResultId} milestones={milestones} />
          {!hasMilestones && (
            <div>
              <Label>انجام شد؟ (یا بالاتر مایل‌استون تعریف کنید)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={booleanValue === true ? 'success' : 'outline'}
                  onClick={() => setBooleanValue(true)}
                >
                  بله
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={booleanValue === false ? 'destructive' : 'outline'}
                  onClick={() => setBooleanValue(false)}
                >
                  خیر
                </Button>
              </div>
            </div>
          )}
          {hasMilestones && (
            <p className="text-xs text-muted-foreground">
              با ثبت چک‌این، وضعیت فعلی چک‌لیست به‌عنوان مقدار این هفته ذخیره می‌شود.
            </p>
          )}
        </div>
      )}

      {metricType === 'TEXT' && (
        <div>
          <Label>گزارش کیفی این هفته</Label>
          <Textarea rows={3} value={textValue} onChange={(e) => setTextValue(e.target.value)} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>وضعیت پیشرفت</Label>
          <Select
            value={progressStatus}
            onChange={(e) =>
              setProgressStatus(e.target.value as 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED')
            }
          >
            <option value="ON_TRACK">در مسیر</option>
            <option value="AT_RISK">در ریسک</option>
            <option value="BLOCKED">بلاک‌شده</option>
            <option value="COMPLETED">تکمیل‌شده</option>
          </Select>
        </div>
        <div>
          <Label>توضیح بلاکر / مشکل (در صورت وجود)</Label>
          <Input value={blockerDescription} onChange={(e) => setBlockerDescription(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={saving} size="sm">
        {saving ? 'در حال ثبت…' : saved ? 'به‌روزرسانی چک‌این این هفته ✔' : 'ثبت چک‌این این هفته'}
      </Button>
    </div>
  );
}
