'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { KrForm, type KrFormValue, type TeamOption } from '@/components/admin/kr-form';
import { NewOkrModal } from '@/components/admin/new-okr-modal';
import { PeriodSelect } from '@/components/admin/period-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { METRIC_LABELS } from '@/lib/progress';

interface TeamAssignment {
  id: string;
  weight: number;
  targetValueOverride: number | null;
  minValueOverride: number | null;
  team: { id: string; name: string };
}

interface Kr {
  id: string;
  title: string;
  weight: number;
  metricType: 'NUMERIC' | 'BOOLEAN' | 'TEXT';
  minValue: number | null;
  targetValue: number | null;
  targetBoolean: boolean;
  unit: string | null;
  description: string | null;
  isShared: boolean;
  teams: TeamAssignment[];
}

interface Objective {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  period: string;
  keyResults: Kr[];
}

function krToFormValue(kr: Kr): KrFormValue {
  return {
    title: kr.title,
    weight: kr.weight,
    metricType: kr.metricType,
    minValue: kr.minValue,
    targetValue: kr.targetValue,
    targetBoolean: kr.targetBoolean ?? true,
    unit: kr.unit,
    description: kr.description,
    teams: kr.teams.map((t) => ({
      teamId: t.team.id,
      weight: t.weight,
      targetValueOverride: t.targetValueOverride,
      minValueOverride: t.minValueOverride,
    })),
  };
}

export default function OkrManagementPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-muted-foreground">در حال بارگذاری…</p>}>
      <OkrManagement />
    </Suspense>
  );
}

function OkrManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamFilter = searchParams.get('team');
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKrId, setEditingKrId] = useState<string | null>(null);
  const [addingKrTo, setAddingKrTo] = useState<string | null>(null);
  const [editingObjectiveId, setEditingObjectiveId] = useState<string | null>(null);
  const [objDraft, setObjDraft] = useState({ title: '', description: '', weight: 1, period: '' });

  const load = useCallback(async () => {
    const [objRes, teamRes] = await Promise.all([
      fetch('/api/admin/objectives'),
      fetch('/api/admin/teams'),
    ]);
    setObjectives(await objRes.json());
    setTeams((await teamRes.json()).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveKr(krId: string, value: KrFormValue) {
    const res = await fetch(`/api/admin/key-results/${krId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    if (!res.ok) {
      alert((await res.json()).error ?? 'خطا در ذخیره');
      return;
    }
    setEditingKrId(null);
    await load();
  }

  async function addKr(objectiveId: string, value: KrFormValue) {
    const res = await fetch('/api/admin/key-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectiveId, ...value }),
    });
    if (!res.ok) {
      alert((await res.json()).error ?? 'خطا در ثبت');
      return;
    }
    setAddingKrTo(null);
    await load();
  }

  async function deleteKr(krId: string) {
    if (!confirm('این نتیجه کلیدی به‌همراه همه‌ی چک‌این‌هایش حذف شود؟')) return;
    await fetch(`/api/admin/key-results/${krId}`, { method: 'DELETE' });
    await load();
  }

  async function deleteObjective(id: string) {
    if (!confirm('این هدف به‌همراه همه‌ی نتایج کلیدی و چک‌این‌هایش حذف شود؟')) return;
    await fetch(`/api/admin/objectives/${id}`, { method: 'DELETE' });
    await load();
  }

  async function saveObjective(id: string) {
    const res = await fetch(`/api/admin/objectives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(objDraft),
    });
    if (!res.ok) {
      alert((await res.json()).error ?? 'خطا در ذخیره');
      return;
    }
    setEditingObjectiveId(null);
    await load();
  }

  if (loading) return <p className="py-10 text-center text-muted-foreground">در حال بارگذاری…</p>;

  // فیلتر بر اساس تیم انتخابی + جستجو
  const qlc = query.trim().toLowerCase();
  const krBelongsToFilter = (kr: Kr) =>
    (!teamFilter || kr.teams.some((t) => t.team.id === teamFilter)) &&
    (!qlc || kr.title.toLowerCase().includes(qlc));
  const visibleObjectives = objectives.filter(
    (obj) =>
      (!teamFilter || obj.keyResults.some((kr) => kr.teams.some((t) => t.team.id === teamFilter))) &&
      (!qlc || obj.title.toLowerCase().includes(qlc) || obj.keyResults.some((kr) => kr.title.toLowerCase().includes(qlc)))
  );
  const filterName = teams.find((t) => t.id === teamFilter)?.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black">
          تعریف و مدیریت OKR{filterName ? ` — تیم ${filterName}` : ''}
        </h1>
        <NewOkrModal defaultTeamId={teamFilter ?? undefined} />
      </div>

      {/* صفحه‌ی هر تیم: فقط OKRهای همان تیم؛ KR مشترک در صفحه‌ی همه‌ی تیم‌هایش دیده می‌شود */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => router.replace('/admin/okrs')}
          className={`rounded-full px-3 py-1 text-sm ${!teamFilter ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-muted'}`}
        >
          همه تیم‌ها
        </button>
        {teams.map((t) => (
          <button
            key={t.id}
            onClick={() => router.replace(`/admin/okrs?team=${t.id}`)}
            className={`rounded-full px-3 py-1 text-sm ${teamFilter === t.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-muted'}`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <Input
        placeholder="جستجوی هدف یا نتیجه کلیدی…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      {visibleObjectives.length === 0 && (
        <Card>
          <CardContent className="pt-5 text-center text-muted-foreground">
            {teamFilter
              ? 'برای این تیم هنوز OKRی تخصیص داده نشده است. از «هدف جدید» یک KR با تخصیص به این تیم بسازید.'
              : 'هنوز هدفی تعریف نشده است. از «هدف جدید» یا «آپلود اکسل» شروع کنید.'}
          </CardContent>
        </Card>
      )}

      {visibleObjectives.map((obj) => (
        <Card key={obj.id}>
          <CardHeader>
            {editingObjectiveId === obj.id ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label>عنوان هدف</Label>
                  <Input value={objDraft.title} onChange={(e) => setObjDraft({ ...objDraft, title: e.target.value })} />
                </div>
                <div>
                  <Label>وزن</Label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={objDraft.weight}
                    onChange={(e) => setObjDraft({ ...objDraft, weight: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>دوره</Label>
                  <PeriodSelect
                    value={objDraft.period}
                    onChange={(period) => setObjDraft({ ...objDraft, period })}
                  />
                </div>
                <div className="md:col-span-4">
                  <Label>توضیحات</Label>
                  <Input
                    value={objDraft.description}
                    onChange={(e) => setObjDraft({ ...objDraft, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 md:col-span-4">
                  <Button size="sm" onClick={() => saveObjective(obj.id)}>ذخیره هدف</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingObjectiveId(null)}>انصراف</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>{obj.title}</CardTitle>
                  <CardDescription>
                    دوره: {obj.period} · وزن: {obj.weight}
                    {obj.description ? ` · ${obj.description}` : ''}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingObjectiveId(obj.id);
                      setObjDraft({
                        title: obj.title,
                        description: obj.description ?? '',
                        weight: obj.weight,
                        period: obj.period,
                      });
                    }}
                  >
                    ویرایش هدف
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteObjective(obj.id)}>
                    حذف
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {obj.keyResults.filter(krBelongsToFilter).map((kr) =>
              editingKrId === kr.id ? (
                <KrForm
                  key={kr.id}
                  teams={teams}
                  initial={krToFormValue(kr)}
                  submitLabel="ذخیره تغییرات"
                  onSubmit={(v) => saveKr(kr.id, v)}
                  onCancel={() => setEditingKrId(null)}
                />
              ) : (
                <div key={kr.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {kr.title}{' '}
                        {kr.isShared && <Badge className="bg-violet-100 text-violet-800">مشترک</Badge>}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {METRIC_LABELS[kr.metricType]} · وزن پیش‌فرض: {kr.weight}
                        {kr.metricType === 'NUMERIC' &&
                          ` · تارگت: ${kr.targetValue ?? '—'} ${kr.unit ?? ''}${kr.minValue !== null ? ` · حداقل: ${kr.minValue}` : ''}`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {kr.teams.map((t) => (
                          <Badge key={t.id} className="bg-muted text-foreground">
                            {t.team.name} (وزن {t.weight}
                            {t.targetValueOverride !== null ? ` · تارگت ${t.targetValueOverride}` : ''})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingKrId(kr.id)}>
                        ویرایش
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteKr(kr.id)}>
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              )
            )}

            {addingKrTo === obj.id ? (
              <KrForm
                teams={teams}
                submitLabel="افزودن نتیجه کلیدی"
                onSubmit={(v) => addKr(obj.id, v)}
                onCancel={() => setAddingKrTo(null)}
              />
            ) : (
              <Button size="sm" variant="outline" onClick={() => setAddingKrTo(obj.id)}>
                + افزودن نتیجه کلیدی
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
