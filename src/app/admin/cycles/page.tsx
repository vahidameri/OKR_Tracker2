'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { JalaliDateInput } from '@/components/ui/jalali-date-input';
import { Label } from '@/components/ui/label';
import { formatJalali } from '@/lib/jalali';

interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/cycles');
    setCycles(await res.json());
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError('');
    if (name.trim().length < 2) return setError('نام دوره را وارد کنید.');
    if (!startDate || !endDate) return setError('تاریخ شروع و پایان را کامل کنید.');
    setSaving(true);
    const res = await fetch('/api/admin/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? 'خطا در ثبت');
    setName('');
    setStartDate('');
    setEndDate('');
    await load();
  }

  async function toggleActive(c: Cycle) {
    await fetch(`/api/admin/cycles/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    await load();
  }

  async function remove(c: Cycle) {
    if (!confirm(`دوره «${c.name}» حذف شود؟ (OKRهای این دوره پاک نمی‌شوند)`)) return;
    await fetch(`/api/admin/cycles/${c.id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">تعریف دوره‌ها (سایکل)</h1>
        <p className="text-sm text-muted-foreground">
          هر دوره یک نام و بازه‌ی تاریخ شمسی دارد. هنگام ساخت OKR، همین دوره‌های فعال در انتخابگر نمایش داده می‌شوند
          و پیشرفت مورد انتظار زمانی بر اساس بازه‌ی همین دوره محاسبه می‌شود.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>دوره‌ی جدید</CardTitle>
          <CardDescription>مثال: نام «تابستان ۱۴۰۵» با شروع ۱ تیر ۱۴۰۵ و پایان ۳۱ شهریور ۱۴۰۵</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>نام دوره</Label>
            <Input placeholder="تابستان ۱۴۰۵" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>تاریخ شروع</Label>
              <JalaliDateInput value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <Label>تاریخ پایان</Label>
              <JalaliDateInput value={endDate} onChange={setEndDate} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={create} disabled={saving}>
            {saving ? 'در حال ثبت…' : 'افزودن دوره'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>دوره‌های تعریف‌شده</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-muted-foreground">در حال بارگذاری…</p>
          ) : cycles.length === 0 ? (
            <p className="text-muted-foreground">هنوز دوره‌ای تعریف نشده است.</p>
          ) : (
            cycles.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div>
                  <p className="font-bold">
                    {c.name}
                    {!c.isActive && <span className="mr-2 text-xs text-muted-foreground">(غیرفعال)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatJalali(c.startDate)} تا {formatJalali(c.endDate)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                    {c.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c)}>
                    حذف
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
