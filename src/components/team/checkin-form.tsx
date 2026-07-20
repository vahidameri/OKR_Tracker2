'use client';

import { Paperclip, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TaskChecklist, type TaskItem } from '@/components/team/task-checklist';
import { formatCompact } from '@/lib/utils';

export interface CheckInFormProps {
  teamKeyResultId: string;
  metricType: 'NUMERIC' | 'BOOLEAN' | 'TEXT';
  unit: string | null;
  tasks?: TaskItem[];
  existing: {
    currentValue: number | null;
    booleanValue: boolean | null;
    textValue: string | null;
    progressStatus: 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED';
    blockerDescription: string | null;
  } | null;
  onSaved?: () => void;
}

// حالت سه‌گانه‌ی KR بله/خیر
type BoolState = 'NO' | 'IN_PROGRESS' | 'YES';
const BOOL_PERCENT: Record<BoolState, number> = { NO: 0, IN_PROGRESS: 50, YES: 100 };

const MAX_FILES = 3;
const MAX_SIZE = 10 * 1024 * 1024;

function initialBoolState(existing: CheckInFormProps['existing']): BoolState | null {
  if (!existing) return null;
  if (existing.currentValue !== null) {
    if (existing.currentValue >= 100) return 'YES';
    if (existing.currentValue <= 0) return 'NO';
    return 'IN_PROGRESS';
  }
  if (existing.booleanValue === true) return 'YES';
  if (existing.booleanValue === false) return 'NO';
  return null;
}

export function CheckInForm({ teamKeyResultId, metricType, unit, tasks = [], existing, onSaved }: CheckInFormProps) {
  const router = useRouter();
  const [currentValue, setCurrentValue] = useState(existing?.currentValue?.toString() ?? '');
  const [boolState, setBoolState] = useState<BoolState | null>(initialBoolState(existing));
  const [taskItems, setTaskItems] = useState<TaskItem[]>(tasks);
  const [textValue, setTextValue] = useState(existing?.textValue ?? '');
  const [progressStatus, setProgressStatus] = useState(existing?.progressStatus ?? 'ON_TRACK');
  const [blockerDescription, setBlockerDescription] = useState(existing?.blockerDescription ?? '');
  const [story, setStory] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existing);

  const numericValue = currentValue.trim() === '' ? null : Number(currentValue.replace(/[,،\s]/g, ''));
  const hasTasks = metricType === 'BOOLEAN' && taskItems.length > 0;

  // درصد و مقدار بولین برای KR بله/خیر: از تسک‌ها یا از حالت سه‌گانه
  function boolPayload(): { currentValue: number | null; booleanValue: boolean | null } {
    if (metricType !== 'BOOLEAN') return { currentValue: numericValue, booleanValue: null };
    if (hasTasks) {
      const done = taskItems.filter((t) => t.isDone).length;
      const pct = Math.round((done / taskItems.length) * 100);
      return { currentValue: pct, booleanValue: pct >= 100 };
    }
    if (boolState === null) return { currentValue: null, booleanValue: null };
    const pct = BOOL_PERCENT[boolState];
    return { currentValue: pct, booleanValue: pct >= 100 };
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((f) => f.size > MAX_SIZE);
    if (tooBig) return setError(`«${tooBig.name}» بزرگ‌تر از ۱۰ مگابایت است.`);
    setError('');
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
  }

  async function submit() {
    setError('');
    if (metricType === 'NUMERIC' && (numericValue === null || !Number.isFinite(numericValue))) {
      return setError('مقدار عددی معتبر وارد کنید.');
    }
    if (metricType === 'BOOLEAN' && !hasTasks && boolState === null) {
      return setError('وضعیت (خیر / در حال انجام / بله) را انتخاب کنید.');
    }
    if (metricType === 'TEXT' && !textValue.trim()) {
      return setError('متن گزارش را بنویسید.');
    }
    if (progressStatus === 'BLOCKED' && !blockerDescription.trim()) {
      return setError('برای وضعیت بلاک‌شده، توضیح بلاکر الزامی است.');
    }

    const bool = boolPayload();
    setSaving(true);
    const res = await fetch('/api/team/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamKeyResultId,
        currentValue: metricType === 'BOOLEAN' ? bool.currentValue : numericValue,
        booleanValue: bool.booleanValue,
        textValue: textValue || null,
        progressStatus,
        blockerDescription: blockerDescription || null,
      }),
    });
    if (!res.ok) {
      setSaving(false);
      setError((await res.json()).error ?? 'خطا در ثبت');
      return;
    }
    const checkIn = await res.json();

    // توضیحات این هفته را به‌عنوان کامنت ثبت کن
    if (story.trim()) {
      await fetch(`/api/checkins/${checkIn.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: story.trim() }),
      }).catch(() => undefined);
    }
    // ضمیمه‌ها را آپلود کن
    if (files.length > 0) {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      await fetch(`/api/checkins/${checkIn.id}/attachments`, { method: 'POST', body: fd }).catch(() => undefined);
    }

    setSaving(false);
    setSaved(true);
    setStory('');
    setFiles([]);
    router.refresh();
    onSaved?.();
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
          <TaskChecklist teamKeyResultId={teamKeyResultId} tasks={taskItems} onChange={setTaskItems} />
          {hasTasks ? (
            <p className="text-xs text-muted-foreground">
              پیشرفت این KR از نسبت تسک‌های انجام‌شده محاسبه می‌شود (
              {taskItems.filter((t) => t.isDone).length} از {taskItems.length}).
            </p>
          ) : (
            <div>
              <Label>وضعیت این هفته؟</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['NO', 'خیر', 'border-[#D03B3B] bg-[#D03B3B] text-white', 'border-border bg-card text-[#D03B3B] hover:border-red-400'],
                    ['IN_PROGRESS', 'در حال انجام', 'border-amber-500 bg-amber-500 text-white', 'border-border bg-card text-amber-700 hover:border-amber-400'],
                    ['YES', 'بله', 'border-primary bg-primary text-white', 'border-border bg-card text-primary hover:border-primary/50'],
                  ] as const
                ).map(([key, label, activeCls, idleCls]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBoolState(key)}
                    className={`rounded-full border px-5 py-1.5 text-sm font-bold transition-colors ${
                      boolState === key ? activeCls : idleCls
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {metricType === 'TEXT' && (
        <div>
          <Label>گزارش کیفی این هفته</Label>
          <Textarea rows={3} value={textValue} onChange={(e) => setTextValue(e.target.value)} />
        </div>
      )}

      <div>
        <Label>چه وضعیتی دارد؟</Label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['ON_TRACK', 'در مسیر', 'border-emerald-600 bg-emerald-600 text-white', 'border-border text-emerald-700 hover:border-emerald-400'],
              ['AT_RISK', 'در ریسک', 'border-amber-500 bg-amber-500 text-white', 'border-border text-amber-700 hover:border-amber-400'],
              ['BLOCKED', '🔒 بلاک‌شده', 'border-[#D03B3B] bg-[#D03B3B] text-white', 'border-border text-[#D03B3B] hover:border-red-400'],
              ['COMPLETED', '✔ تکمیل‌شده', 'border-primary bg-primary text-white', 'border-border text-primary hover:border-primary/50'],
            ] as const
          ).map(([key, label, activeCls, idleCls]) => (
            <button
              key={key}
              type="button"
              onClick={() => setProgressStatus(key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${
                progressStatus === key ? activeCls : `bg-card ${idleCls}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>توضیح بلاکر / مشکل (در صورت وجود)</Label>
        <Input value={blockerDescription} onChange={(e) => setBlockerDescription(e.target.value)} />
      </div>

      <div>
        <Label>توضیحات این هفته (اختیاری)</Label>
        <Textarea
          rows={2}
          placeholder="این هفته چه چیزی پیش رفت؟ بلاکری هست که تیم باید بداند؟"
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />
      </div>

      <div>
        <Label>ضمیمه (اختیاری — حداکثر ۳ فایل، هرکدام تا ۱۰ مگابایت)</Label>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf,.docx"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/40"
        >
          <Paperclip className="h-4 w-4" />
          افزودن فایل (PNG, JPG, PDF, DOCX)
        </button>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded-md bg-muted px-2 py-1 text-xs">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={saving} size="sm">
        {saving ? 'در حال ثبت…' : saved ? 'به‌روزرسانی چک‌این این هفته ✔' : 'ثبت چک‌این این هفته'}
      </Button>
    </div>
  );
}
