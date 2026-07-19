'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { KrForm, type KrFormValue, type TeamOption } from '@/components/admin/kr-form';
import { PeriodSelect } from '@/components/admin/period-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { METRIC_LABELS } from '@/lib/progress';

export default function NewObjectivePage() {
  const router = useRouter();
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
    fetch('/api/admin/teams')
      .then((r) => r.json())
      .then((data) => setTeams(data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))));
  }, []);

  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? id;

  async function submit() {
    setError('');
    if (title.trim().length < 2) return setError('عنوان هدف الزامی است.');
    if (!period.trim()) return setError('دوره (مثلاً Q2-1405) الزامی است.');
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
    router.push('/admin/okrs');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-black">تعریف هدف جدید</h1>

      <Card>
        <CardHeader>
          <CardTitle>مشخصات هدف</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <Label>عنوان هدف *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>وزن هدف</Label>
            <Input type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
          </div>
          <div>
            <Label>دوره (شمسی) *</Label>
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
          <div className="md:col-span-3">
            <Label>توضیحات</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>نتایج کلیدی</CardTitle>
          <CardDescription>
            هر KR را به یک یا چند تیم با وزن اختصاصی همان تیم تخصیص دهید. می‌توانید KRها را بعداً هم اضافه کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {keyResults.map((kr, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
              <div>
                <p className="font-medium">{kr.title}</p>
                <p className="text-xs text-muted-foreground">
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
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving}>
          {saving ? 'در حال ثبت…' : 'ثبت هدف'}
        </Button>
        <Button variant="ghost" onClick={() => router.push('/admin/okrs')}>
          انصراف
        </Button>
      </div>
    </div>
  );
}
