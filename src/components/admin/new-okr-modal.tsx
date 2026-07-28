'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  KrForm,
  type KrFormValue,
  type TeamAssignmentInput,
  type TeamOption,
} from '@/components/admin/kr-form';
import { PeriodSelect } from '@/components/admin/period-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { METRIC_LABELS } from '@/lib/progress';

const STEPS = ['هدف و تیم', 'تیم‌های مشترک', 'نتایج کلیدی', 'بازبینی'] as const;

/** ویزارد ساخت OKR — تیم در سطح «هدف» انتخاب می‌شود و همه‌ی نتایج کلیدی آن را به ارث می‌برند */
export function NewOkrModal({ defaultTeamId }: { defaultTeamId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [teams, setTeams] = useState<TeamOption[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState(1);
  const [period, setPeriod] = useState('');
  // تخصیص تیم در سطح هدف: عنصر اول = تیم انتخاب‌شده، بقیه = تیم‌های مشترک
  const [objTeams, setObjTeams] = useState<TeamAssignmentInput[]>(
    defaultTeamId ? [{ teamId: defaultTeamId, weight: 1, targetValueOverride: null, minValueOverride: null }] : []
  );
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
    setObjTeams(
      defaultTeamId
        ? [{ teamId: defaultTeamId, weight: 1, targetValueOverride: null, minValueOverride: null }]
        : []
    );
    setKeyResults([]);
    setShowKrForm(false);
    setError('');
  }

  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? id;
  const primary = objTeams[0] ?? null;
  const sharedTeams = objTeams.slice(1);

  function setPrimaryTeam(teamId: string) {
    setObjTeams((prev) => {
      const rest = prev.slice(1).filter((t) => t.teamId !== teamId);
      const w = prev[0]?.weight ?? 1;
      return [{ teamId, weight: w, targetValueOverride: null, minValueOverride: null }, ...rest];
    });
  }
  function setPrimaryWeight(w: number) {
    setObjTeams((prev) => (prev.length ? [{ ...prev[0], weight: w }, ...prev.slice(1)] : prev));
  }
  function toggleShared(teamId: string) {
    setObjTeams((prev) => {
      const exists = prev.some((t, i) => i >= 1 && t.teamId === teamId);
      return exists
        ? prev.filter((t) => t.teamId !== teamId)
        : [...prev, { teamId, weight: 1, targetValueOverride: null, minValueOverride: null }];
    });
  }
  function setSharedWeight(teamId: string, w: number) {
    setObjTeams((prev) => prev.map((t) => (t.teamId === teamId ? { ...t, weight: w } : t)));
  }

  const krWeightSum = keyResults.reduce((s, k) => s + (k.weight || 0), 0);
  const weightMatches = keyResults.length === 0 || Math.abs(krWeightSum - weight) < 0.01;
  const badTeamWeight = (w: number) => !w || w <= 0 || w > 100;

  function goShared() {
    setError('');
    if (title.trim().length < 2) return setError('عنوان هدف الزامی است.');
    if (!period.trim()) return setError('دوره را انتخاب کنید.');
    if (!primary) return setError('تیم این هدف را انتخاب کنید.');
    if (badTeamWeight(primary.weight)) return setError('وزن تیم باید بین ۰ تا ۱۰۰ باشد.');
    setStep(1);
  }

  function goKrs() {
    setError('');
    if (objTeams.some((t) => badTeamWeight(t.weight))) return setError('وزن هر تیم باید بین ۰ تا ۱۰۰ باشد.');
    setStep(2);
  }

  function goReview() {
    setError('');
    if (keyResults.length === 0) return setError('حداقل یک نتیجه کلیدی اضافه کنید.');
    if (!weightMatches)
      return setError(`مجموع وزن نتایج کلیدی (${krWeightSum}) باید با وزن هدف (${weight}) برابر باشد.`);
    setStep(3);
  }

  async function submit() {
    setError('');
    if (keyResults.length === 0) return setError('حداقل یک نتیجه کلیدی اضافه کنید.');
    if (!weightMatches)
      return setError(`مجموع وزن نتایج کلیدی (${krWeightSum}) باید با وزن هدف (${weight}) برابر باشد.`);
    setSaving(true);
    // تیم‌های سطح هدف را به همه‌ی نتایج کلیدی اعمال کن
    const withTeams = keyResults.map((kr) => ({ ...kr, teams: objTeams }));
    const res = await fetch('/api/admin/objectives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || null, weight, period, keyResults: withTeams }),
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

        {/* استپ ۱: هدف + تیم و وزن */}
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

            {/* تیم این هدف */}
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
              <div>
                <Label>تیم این هدف *</Label>
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
                <Label>وزن تیم (۰ تا ۱۰۰) *</Label>
                <Input
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={primary?.weight ?? 1}
                  onChange={(e) => setPrimaryWeight(Number(e.target.value))}
                  disabled={!primary}
                />
              </div>
            </div>
          </div>
        )}

        {/* استپ ۲: تیم‌های مشترک */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-card p-3 text-sm">
              تیم این هدف: <b>{primary ? teamName(primary.teamId) : '—'}</b>
              {primary && <span className="text-muted-foreground"> · وزن {primary.weight}</span>}
            </div>
            <Label>تیم‌های مشترک (اختیاری)</Label>
            <p className="text-xs text-muted-foreground">
              اگر این هدف بین چند تیم مشترک است، تیم‌های دیگر را انتخاب و وزن هرکدام را وارد کنید. این تخصیص روی
              همه‌ی نتایج کلیدی این هدف اعمال می‌شود.
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
                        <div className="flex items-center gap-1 text-xs">
                          <span>وزن (۰-۱۰۰):</span>
                          <Input
                            type="number"
                            min={0.1}
                            max={100}
                            step={0.1}
                            className="h-8 w-20"
                            value={assignment.weight}
                            onChange={(e) => setSharedWeight(team.id, Number(e.target.value))}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
            {sharedTeams.length > 0 && (
              <p className="text-xs font-bold text-violet-700">
                این هدف «مشترک» بین {objTeams.length} تیم ثبت می‌شود.
              </p>
            )}
          </div>
        )}

        {/* استپ ۳: نتایج کلیدی (بدون انتخاب تیم) */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              چطور موفقیت را می‌سنجید؟ نتایج کلیدی را اضافه کنید — همگی به تیم(های) انتخاب‌شده در مرحله‌ی هدف تعلق
              می‌گیرند.
            </p>

            {/* مجموع وزن نتایج کلیدی باید با وزن هدف برابر باشد */}
            <div
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-bold ${
                weightMatches
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <span>
                مجموع وزن نتایج کلیدی: {krWeightSum} از {weight}
              </span>
              <span>
                {weightMatches ? '✓ برابر با وزن هدف' : `باید ${weight} شود`}
              </span>
            </div>
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
                    {kr.metricType === 'BOOLEAN' ? ` · تارگت ${kr.targetBoolean ? 'بله' : 'خیر'}` : ''}
                  </p>
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
                hideTeams
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

        {/* استپ ۴: بازبینی */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">هدف · {period}</p>
              <p className="text-lg font-black">{title}</p>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {objTeams.length > 1 && (
                  <Badge className="bg-violet-100 text-violet-800">مشترک بین {objTeams.length} تیم</Badge>
                )}
                {objTeams.map((t) => (
                  <Badge key={t.teamId} className="bg-muted text-foreground">
                    {teamName(t.teamId)} · وزن {t.weight}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm font-bold">{keyResults.length} نتیجه کلیدی:</p>
            {keyResults.map((kr, i) => (
              <div key={i} className="rounded-lg border border-border p-2 text-sm">
                {i + 1}. {kr.title}
                <span className="mr-2 text-xs text-muted-foreground">
                  ({METRIC_LABELS[kr.metricType]}
                  {kr.metricType === 'NUMERIC' ? ` · تارگت ${kr.targetValue}` : ''}
                  {kr.metricType === 'BOOLEAN' ? ` · تارگت ${kr.targetBoolean ? 'بله' : 'خیر'}` : ''})
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
          {step === 0 && <Button onClick={goShared}>بعدی ←</Button>}
          {step === 1 && <Button onClick={goKrs}>بعدی ←</Button>}
          {step === 2 && (
            <Button onClick={goReview} disabled={keyResults.length === 0 || !weightMatches}>
              بازبینی ←
            </Button>
          )}
          {step === 3 && (
            <Button onClick={submit} disabled={saving}>
              {saving ? 'در حال ثبت…' : 'ثبت هدف'}
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}
