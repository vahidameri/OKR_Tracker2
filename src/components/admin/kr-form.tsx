'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface TeamOption {
  id: string;
  name: string;
}

export interface TeamAssignmentInput {
  teamId: string;
  weight: number;
  targetValueOverride: number | null;
  minValueOverride: number | null;
}

export interface KrFormValue {
  title: string;
  weight: number;
  metricType: 'NUMERIC' | 'BOOLEAN' | 'TEXT';
  minValue: number | null;
  targetValue: number | null;
  targetBoolean: boolean;
  unit: string | null;
  description: string | null;
  teams: TeamAssignmentInput[];
}

const emptyValue: KrFormValue = {
  title: '',
  weight: 1,
  metricType: 'NUMERIC',
  minValue: null,
  targetValue: null,
  targetBoolean: true,
  unit: '',
  description: '',
  teams: [],
};

function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const KR_STEPS = ['جزئیات و تیم', 'تیم‌های مشترک'] as const;

export function KrForm({
  teams,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  hideTeams = false,
}: {
  teams: TeamOption[];
  initial?: KrFormValue;
  submitLabel: string;
  onSubmit: (value: KrFormValue) => Promise<void> | void;
  onCancel?: () => void;
  /** وقتی true باشد، تخصیص تیم در این فرم نمایش داده نمی‌شود (تیم در سطح هدف انتخاب می‌شود) */
  hideTeams?: boolean;
}) {
  const [value, setValue] = useState<KrFormValue>(initial ?? emptyValue);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof KrFormValue>(key: K, v: KrFormValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  // تیم انتخاب‌شده در استپ ۱ = اولین تخصیص؛ بقیه = تیم‌های مشترک (بدون مفهوم مالکیت)
  const primary = value.teams[0] ?? null;
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? id;

  function setPrimaryTeam(teamId: string) {
    setValue((prev) => {
      const rest = prev.teams.slice(1).filter((t) => t.teamId !== teamId);
      const w = prev.teams[0]?.weight ?? prev.weight ?? 1;
      return {
        ...prev,
        teams: [{ teamId, weight: w, targetValueOverride: null, minValueOverride: null }, ...rest],
      };
    });
  }

  function setPrimaryWeight(w: number) {
    setValue((prev) =>
      prev.teams.length
        ? { ...prev, teams: [{ ...prev.teams[0], weight: w }, ...prev.teams.slice(1)] }
        : prev
    );
  }

  function toggleShared(teamId: string) {
    setValue((prev) => {
      const exists = prev.teams.some((t, i) => i >= 1 && t.teamId === teamId);
      if (exists) {
        return { ...prev, teams: prev.teams.filter((t) => t.teamId !== teamId) };
      }
      return {
        ...prev,
        teams: [
          ...prev.teams,
          { teamId, weight: prev.weight || 1, targetValueOverride: null, minValueOverride: null },
        ],
      };
    });
  }

  function setSharedAssignment(teamId: string, patch: Partial<TeamAssignmentInput>) {
    setValue((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.teamId === teamId ? { ...t, ...patch } : t)),
    }));
  }

  function goNext() {
    setError('');
    if (value.title.trim().length < 2) return setError('عنوان نتیجه کلیدی الزامی است.');
    if (value.metricType === 'NUMERIC' && value.targetValue === null)
      return setError('برای KR عددی، تارگت الزامی است.');
    if (!primary) return setError('تیم را انتخاب کنید.');
    if (!primary.weight || primary.weight <= 0) return setError('وزن تیم باید عدد مثبت باشد.');
    setStep(1);
  }

  async function handleSubmit() {
    setError('');
    if (hideTeams) {
      // اعتبارسنجی جزئیات KR (تیم در سطح هدف انتخاب می‌شود)
      if (value.title.trim().length < 2) return setError('عنوان نتیجه کلیدی الزامی است.');
      if (value.metricType === 'NUMERIC' && value.targetValue === null)
        return setError('برای KR عددی، تارگت الزامی است.');
    } else {
      if (value.teams.length === 0) return setError('حداقل یک تیم باید انتخاب شود.');
      if (value.teams.some((t) => !t.weight || t.weight <= 0))
        return setError('وزن همه‌ی تیم‌های انتخاب‌شده باید عدد مثبت باشد.');
    }
    setSaving(true);
    try {
      await onSubmit(value);
    } finally {
      setSaving(false);
    }
  }

  const sharedTeams = value.teams.slice(1);

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
      {/* استپر داخلی تخصیص تیم (فقط وقتی تیم در همین فرم انتخاب می‌شود) */}
      {!hideTeams && (
      <div className="flex items-center gap-2">
        {KR_STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                i < step
                  ? 'bg-primary text-white'
                  : i === step
                    ? 'bg-primary/15 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={`text-xs ${i === step ? 'font-bold' : 'text-muted-foreground'}`}>{label}</span>
            {i < KR_STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>
      )}

      {/* استپ ۱: جزئیات KR (+ تیم و وزن وقتی تیم در همین فرم انتخاب می‌شود) */}
      {(step === 0 || hideTeams) && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>عنوان نتیجه کلیدی *</Label>
            <Input value={value.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <Label>وزن پیش‌فرض KR</Label>
            <Input
              type="number"
              min={0.1}
              step={0.1}
              value={value.weight}
              onChange={(e) => set('weight', Number(e.target.value))}
            />
          </div>
          <div>
            <Label>نوع سنجش</Label>
            <Select
              value={value.metricType}
              onChange={(e) => set('metricType', e.target.value as KrFormValue['metricType'])}
            >
              <option value="NUMERIC">عددی</option>
              <option value="BOOLEAN">بله/خیر</option>
              <option value="TEXT">محتوایی (کیفی)</option>
            </Select>
          </div>

          {value.metricType === 'BOOLEAN' && (
            <>
              <div>
                <Label>تارگت (مقدار هدف)</Label>
                <Select
                  value={value.targetBoolean ? 'YES' : 'NO'}
                  onChange={(e) => set('targetBoolean', e.target.value === 'YES')}
                >
                  <option value="YES">بله</option>
                  <option value="NO">خیر</option>
                </Select>
              </div>
              <p className="self-end pb-2 text-xs text-muted-foreground">
                KR بله/خیر: تیم در چک‌این هفتگی مشخص می‌کند به تارگت رسیده یا نه (بله = ۱۰۰٪، خیر = ۰٪).
              </p>
            </>
          )}
          {value.metricType === 'NUMERIC' && (
            <>
              <div>
                <Label>حداقل (نقطه شروع)</Label>
                <Input
                  type="number"
                  dir="ltr"
                  value={value.minValue ?? ''}
                  onChange={(e) => set('minValue', num(e.target.value))}
                />
              </div>
              <div>
                <Label>تارگت *</Label>
                <Input
                  type="number"
                  dir="ltr"
                  value={value.targetValue ?? ''}
                  onChange={(e) => set('targetValue', num(e.target.value))}
                />
              </div>
              <div>
                <Label>واحد (نفر، تومان، درصد و…)</Label>
                <Input value={value.unit ?? ''} onChange={(e) => set('unit', e.target.value)} />
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <Label>توضیحات تکمیلی</Label>
            <Textarea
              rows={2}
              value={value.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* تیم و وزن — فقط وقتی تیم در همین فرم انتخاب می‌شود */}
          {!hideTeams && (
            <div className="md:col-span-2 grid gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-2">
              <div>
                <Label>تیم *</Label>
                <Select value={primary?.teamId ?? ''} onChange={(e) => setPrimaryTeam(e.target.value)}>
                  <option value="" disabled>
                    انتخاب تیم…
                  </option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>وزن تیم *</Label>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={primary?.weight ?? value.weight}
                  onChange={(e) => setPrimaryWeight(Number(e.target.value))}
                  disabled={!primary}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* استپ ۲: تیم‌های مشترک */}
      {!hideTeams && step === 1 && (
        <div className="space-y-3">
          <div className="rounded-md bg-card p-3 text-sm">
            تیم انتخاب‌شده: <b>{primary ? teamName(primary.teamId) : '—'}</b>
            {primary && <span className="text-muted-foreground"> · وزن {primary.weight}</span>}
          </div>
          <div>
            <Label>تیم‌های مشترک (اختیاری)</Label>
            <p className="mb-2 text-xs text-muted-foreground">
              اگر این KR بین چند تیم مشترک است، تیم‌های دیگر را انتخاب و وزن هرکدام را وارد کنید. اگر تیمی
              انتخاب نشود، KR فقط برای تیم اصلی ثبت می‌شود.
            </p>
            <div className="space-y-2">
              {teams
                .filter((team) => team.id !== primary?.teamId)
                .map((team) => {
                  const assignment = sharedTeams.find((t) => t.teamId === team.id);
                  return (
                    <div
                      key={team.id}
                      className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-2"
                    >
                      <label className="flex min-w-28 items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={!!assignment} onChange={() => toggleShared(team.id)} />
                        {team.name}
                      </label>
                      {assignment && (
                        <>
                          <div className="flex items-center gap-1 text-xs">
                            <span>وزن:</span>
                            <Input
                              type="number"
                              min={0.1}
                              step={0.1}
                              className="h-8 w-20"
                              value={assignment.weight}
                              onChange={(e) => setSharedAssignment(team.id, { weight: Number(e.target.value) })}
                            />
                          </div>
                          {value.metricType === 'NUMERIC' && (
                            <div className="flex items-center gap-1 text-xs">
                              <span>تارگت تیمی:</span>
                              <Input
                                type="number"
                                dir="ltr"
                                className="h-8 w-28"
                                placeholder="پیش‌فرض KR"
                                value={assignment.targetValueOverride ?? ''}
                                onChange={(e) =>
                                  setSharedAssignment(team.id, { targetValueOverride: num(e.target.value) })
                                }
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
            {sharedTeams.length > 0 && (
              <p className="mt-2 text-xs font-bold text-violet-700">
                این KR «مشترک» بین {value.teams.length} تیم ثبت می‌شود.
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <div>
          {!hideTeams && step === 1 && (
            <Button variant="ghost" onClick={() => setStep(0)}>
              → قبلی
            </Button>
          )}
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              انصراف
            </Button>
          )}
        </div>
        {!hideTeams && step === 0 ? (
          <Button onClick={goNext}>بعدی ←</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'در حال ذخیره…' : submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
