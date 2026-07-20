'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { KrForm, type KrFormValue, type TeamOption } from '@/components/admin/kr-form';
import { PeriodSelect } from '@/components/admin/period-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { METRIC_LABELS } from '@/lib/progress';

const STEPS = ['هدف', 'نتایج کلیدی', 'بازبینی'] as const;

/** ویزارد ساخت OKR به‌صورت مودال سه‌مرحله‌ای — الهام‌گرفته از «Create OKR» مرجع */
export function NewOkrModal({ defaultTeamId }: { defaultTeamId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [teams, setTeams] = useState<TeamOption[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState(1);
  const [period, setPeriod] = useState('');
  const [keyResults, setKeyResults] = useState<KrFormValue[]>([]);
  const [showKrForm, setShowKrForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && teams.length === 0) {
      fetch('/api/admin/teams')
        .then((r) => r.json())
        .then((data) => setTeams(data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))));
    }
  }, [open, teams.length]);

  function reset() {
    setStep(0);
    setTitle('');
    setDescription('');
    setWeight(1);
    setPeriod('');
    setKeyResults([]);
    setShowKrForm(false);
    setError('');
  }

  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? id;

  function goDetails() {
    setError('');
    if (title.trim().length < 2) return setError('عنوان هدف الزامی است.');
    if (!period.trim()) return setError('دوره را انتخاب کنید.');
    setStep(1);
  }

  async function submit() {
    setError('');
    if (keyResults.length === 0) return setError('حداقل یک نتیجه کلیدی اضافه کنید.');
    setSaving(true);
    const res = await fetch('/api/admin/objectives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || null, weight, period, keyResults }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error ?? 'خطا در ثبت هدف');
      return;
    }
    setOpen(false);
    reset();
    router.refresh();
  }

  // KR جدید با تیم پیش‌فرض همان تب فعال
  const initialKr: KrFormValue | undefined = defaultTeamId
    ? {
        title: '',
        weight: 1,
        metricType: 'NUMERIC',
        minValue: null,
        targetValue: null,
        unit: '',
        description: '',
        teams: [{ teamId: defaultTeamId, weight: 1, targetValueOverride: null, minValueOverride: null }],
      }
    : undefined;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
      >
        + ایجاد OKR
      </button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="ایجاد OKR"
        wide
      >
        {/* استپر */}
        <div className="mb-5 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  i < step
                    ? 'bg-primary text-white'
                    : i === step
                      ? 'bg-primary/15 text-primary ring-2 ring-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`text-xs ${i === step ? 'font-bold' : 'text-muted-foreground'}`}>{label}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>عنوان هدف *</Label>
              <Input
                placeholder="سازمان این فصل می‌خواهد به چه چیزی برسد؟"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>وزن هدف</Label>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>دوره (شمسی) *</Label>
                <PeriodSelect value={period} onChange={setPeriod} />
              </div>
            </div>
            <div>
              <Label>توضیحات</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              چطور موفقیت را می‌سنجید؟ هر KR را به یک یا چند تیم با وزن اختصاصی تخصیص دهید.
            </p>
            {keyResults.map((kr, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div>
                  <p className="font-bold">
                    <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                      {i + 1}
                    </span>
                    {kr.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {METRIC_LABELS[kr.metricType]} · وزن {kr.weight}
                    {kr.metricType === 'NUMERIC' ? ` · تارگت ${kr.targetValue}` : ''}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {kr.teams.map((t) => (
                      <Badge key={t.teamId} className="bg-muted text-foreground">
                        {teamName(t.teamId)} (وزن {t.weight})
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setKeyResults(keyResults.filter((_, j) => j !== i))}
                >
                  حذف
                </Button>
              </div>
            ))}

            {showKrForm ? (
              <KrForm
                teams={teams}
                initial={initialKr}
                submitLabel="افزودن به فهرست"
                onSubmit={(v) => {
                  setKeyResults([...keyResults, v]);
                  setShowKrForm(false);
                }}
                onCancel={() => setShowKrForm(false)}
              />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowKrForm(true)}>
                + افزودن نتیجه کلیدی
              </Button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">هدف · {period}</p>
              <p className="text-lg font-black">{title}</p>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            <p className="text-sm font-bold">{keyResults.length} نتیجه کلیدی:</p>
            {keyResults.map((kr, i) => (
              <div key={i} className="rounded-lg border border-border p-2 text-sm">
                {i + 1}. {kr.title}
                <span className="mr-2 text-xs text-muted-foreground">
                  ({kr.teams.map((t) => teamName(t.teamId)).join('، ')})
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              → قبلی
            </Button>
          ) : (
            <span />
          )}
          {step === 0 && <Button onClick={goDetails}>بعدی ←</Button>}
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={keyResults.length === 0}>
              بازبینی ←
            </Button>
          )}
          {step === 2 && (
            <Button onClick={submit} disabled={saving}>
              {saving ? 'در حال ثبت…' : 'ثبت هدف'}
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}
