'use client';

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
  unit: '',
  description: '',
  teams: [],
};

function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function KrForm({
  teams,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  teams: TeamOption[];
  initial?: KrFormValue;
  submitLabel: string;
  onSubmit: (value: KrFormValue) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState<KrFormValue>(initial ?? emptyValue);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof KrFormValue>(key: K, v: KrFormValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  function toggleTeam(teamId: string) {
    setValue((prev) => {
      const exists = prev.teams.find((t) => t.teamId === teamId);
      return {
        ...prev,
        teams: exists
          ? prev.teams.filter((t) => t.teamId !== teamId)
          : [
              ...prev.teams,
              { teamId, weight: prev.weight || 1, targetValueOverride: null, minValueOverride: null },
            ],
      };
    });
  }

  function setAssignment(teamId: string, patch: Partial<TeamAssignmentInput>) {
    setValue((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.teamId === teamId ? { ...t, ...patch } : t)),
    }));
  }

  async function handleSubmit() {
    setError('');
    if (value.title.trim().length < 2) return setError('عنوان نتیجه کلیدی الزامی است.');
    if (value.teams.length === 0) return setError('حداقل یک تیم باید انتخاب شود.');
    if (value.metricType === 'NUMERIC' && value.targetValue === null)
      return setError('برای KR عددی، تارگت الزامی است.');
    if (value.teams.some((t) => !t.weight || t.weight <= 0))
      return setError('وزن تیمی همه‌ی تیم‌های انتخاب‌شده باید عدد مثبت باشد.');
    setSaving(true);
    try {
      await onSubmit(value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
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
      </div>

      <div>
        <Label>تخصیص به تیم‌ها (با وزن اختصاصی هر تیم) *</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          اگر بیش از یک تیم انتخاب شود، KR «مشترک» ثبت می‌شود و هر تیم وزن و در صورت نیاز تارگت مخصوص خودش را دارد.
        </p>
        <div className="space-y-2">
          {teams.map((team) => {
            const assignment = value.teams.find((t) => t.teamId === team.id);
            return (
              <div key={team.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-2">
                <label className="flex min-w-28 items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={!!assignment} onChange={() => toggleTeam(team.id)} />
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
                        onChange={(e) => setAssignment(team.id, { weight: Number(e.target.value) })}
                      />
                    </div>
                    {value.metricType === 'NUMERIC' && (
                      <>
                        <div className="flex items-center gap-1 text-xs">
                          <span>تارگت تیمی:</span>
                          <Input
                            type="number"
                            dir="ltr"
                            className="h-8 w-28"
                            placeholder="پیش‌فرض KR"
                            value={assignment.targetValueOverride ?? ''}
                            onChange={(e) => setAssignment(team.id, { targetValueOverride: num(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span>حداقل تیمی:</span>
                          <Input
                            type="number"
                            dir="ltr"
                            className="h-8 w-28"
                            placeholder="پیش‌فرض KR"
                            value={assignment.minValueOverride ?? ''}
                            onChange={(e) => setAssignment(team.id, { minValueOverride: num(e.target.value) })}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'در حال ذخیره…' : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            انصراف
          </Button>
        )}
      </div>
    </div>
  );
}
