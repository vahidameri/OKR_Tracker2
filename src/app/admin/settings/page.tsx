'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
  const [ahead, setAhead] = useState('5');
  const [atRisk, setAtRisk] = useState('10');
  const [behind, setBehind] = useState('25');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((t) => {
        setAhead(String(t.ahead));
        setAtRisk(String(t.atRisk));
        setBehind(String(t.behind));
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ahead: Number(ahead), atRisk: Number(atRisk), behind: Number(behind) }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ ok: true, text: '✔ آستانه‌ها ذخیره شد و از همین حالا در همه‌ی محاسبات اعمال می‌شود.' });
    } else {
      setMessage({ ok: false, text: (await res.json()).error ?? 'خطا در ذخیره' });
    }
  }

  if (loading) return <p className="py-10 text-center text-muted-foreground">در حال بارگذاری…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-black">تنظیمات سیستم</h1>

      <Card>
        <CardHeader>
          <CardTitle>آستانه‌های وضعیت زمانی خودکار</CardTitle>
          <CardDescription>
            مبنا: اختلاف «پیشرفت واقعی − پیشرفت مورد انتظار زمان» به واحد درصدپوینت. این اعداد بعد از استفاده‌ی
            واقعی احتمالاً نیاز به تنظیم دارند — تغییرشان بلافاصله روی داشبورد، گزارش‌ها و لیدربورد اثر می‌گذارد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>جلوتر از برنامه (+)</Label>
              <Input type="number" min={0} max={100} value={ahead} onChange={(e) => setAhead(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">جلوتر از این‌قدر = «جلوتر از برنامه»</p>
            </div>
            <div>
              <Label>در ریسک (−)</Label>
              <Input type="number" min={0} max={100} value={atRisk} onChange={(e) => setAtRisk(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">عقب‌تر از این‌قدر = «در ریسک»</p>
            </div>
            <div>
              <Label>عقب‌افتاده (−)</Label>
              <Input type="number" min={0} max={100} value={behind} onChange={(e) => setBehind(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">عقب‌تر از این‌قدر = «عقب‌افتاده»</p>
            </div>
          </div>
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            مثال با مقادیر فعلی: اگر انتظار زمانی ۵۰٪ باشد — پیشرفت ≥ {50 + Number(ahead) || 0}٪ جلوتر از برنامه،
            تا {50 - Number(atRisk) || 0}٪ در مسیر، تا {50 - Number(behind) || 0}٪ در ریسک، کمتر از آن عقب‌افتاده.
          </div>
          {message && (
            <p className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-destructive'}`}>{message.text}</p>
          )}
          <Button onClick={save} disabled={saving}>
            {saving ? 'در حال ذخیره…' : 'ذخیره آستانه‌ها'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
