'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { METRIC_LABELS } from '@/lib/progress';

interface PreviewTeam {
  teamName: string;
  teamId: string | null;
  weight: number;
  targetValueOverride: number | null;
}

interface PreviewRow {
  rowNumber: number;
  objectiveTitle: string;
  objectiveDescription: string | null;
  objectiveWeight: number;
  period: string;
  krTitle: string;
  krWeight: number;
  metricType: 'NUMERIC' | 'BOOLEAN' | 'TEXT';
  minValue: number | null;
  targetValue: number | null;
  unit: string | null;
  description: string | null;
  teams: PreviewTeam[];
  errors: string[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ objectivesCreated: number; krsCreated: number } | null>(null);

  const validRows = rows?.filter((r) => r.errors.length === 0) ?? [];
  const invalidRows = rows?.filter((r) => r.errors.length > 0) ?? [];

  async function upload() {
    if (!file) return;
    setError('');
    setResult(null);
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/import', { method: 'POST', body: form });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'خطا در پردازش فایل');
      return;
    }
    setRows(data.rows);
  }

  async function confirm() {
    setError('');
    setLoading(true);
    const res = await fetch('/api/admin/import/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: validRows.map((r) => ({
          ...r,
          teams: r.teams.map((t) => ({
            teamId: t.teamId!,
            weight: t.weight,
            targetValueOverride: t.targetValueOverride,
          })),
        })),
      }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'خطا در ثبت نهایی');
      return;
    }
    setResult(data);
    setRows(null);
    setFile(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black">آپلود اکسل OKR</h1>

      <Card>
        <CardHeader>
          <CardTitle>۱. انتخاب فایل</CardTitle>
          <CardDescription>
            فایل xlsx با ستون‌های: هدف، توضیحات هدف، وزن هدف، دوره، نتیجه کلیدی، وزن نتیجه کلیدی، نوع سنجش
            (عددی/بله‌خیر/محتوایی)، حداقل، تارگت، واحد، توضیحات، تیم‌ها (جداشده با «،»)، وزن تیمی، تارگت تیمی.{' '}
            <a href="/api/admin/import/template" className="text-primary underline">
              دانلود فایل نمونه
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <Button onClick={upload} disabled={!file || loading}>
            {loading ? 'در حال پردازش…' : 'پردازش و پیش‌نمایش'}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <Card>
          <CardContent className="pt-5 text-emerald-700">
            ✔ ثبت نهایی انجام شد: {result.objectivesCreated} هدف جدید و {result.krsCreated} نتیجه کلیدی ایجاد شد.
          </CardContent>
        </Card>
      )}

      {rows && (
        <Card>
          <CardHeader>
            <CardTitle>۲. پیش‌نمایش ({rows.length} ردیف)</CardTitle>
            <CardDescription>
              {validRows.length} ردیف معتبر ثبت می‌شود؛ {invalidRows.length} ردیف خطادار نادیده گرفته می‌شود.
              ردیف‌های هم‌عنوانِ هم‌دوره زیر یک هدف گروه می‌شوند.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <THead>
                <TR>
                  <TH>ردیف</TH>
                  <TH>هدف</TH>
                  <TH>نتیجه کلیدی</TH>
                  <TH>نوع</TH>
                  <TH>تارگت</TH>
                  <TH>تیم‌ها</TH>
                  <TH>وضعیت</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <TR key={r.rowNumber} className={r.errors.length ? 'bg-red-50' : ''}>
                    <TD>{r.rowNumber}</TD>
                    <TD className="max-w-40">{r.objectiveTitle || '—'}</TD>
                    <TD className="max-w-52">{r.krTitle || '—'}</TD>
                    <TD>{METRIC_LABELS[r.metricType]}</TD>
                    <TD>{r.targetValue ?? '—'}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {r.teams.map((t, i) => (
                          <Badge
                            key={i}
                            className={t.teamId ? 'bg-muted text-foreground' : 'bg-red-100 text-red-800'}
                          >
                            {t.teamName} (وزن {t.weight})
                          </Badge>
                        ))}
                      </div>
                    </TD>
                    <TD>
                      {r.errors.length === 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800">معتبر</Badge>
                      ) : (
                        <ul className="list-inside list-disc text-xs text-red-700">
                          {r.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Button onClick={confirm} disabled={validRows.length === 0 || loading} variant="success">
              {loading ? 'در حال ثبت…' : `تأیید نهایی و ثبت ${validRows.length} ردیف معتبر`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
