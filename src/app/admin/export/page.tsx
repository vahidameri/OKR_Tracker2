import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DATASETS = [
  { key: 'checkins', label: 'چک‌این‌های هفتگی', desc: 'همه‌ی ثبت‌های هفتگی تیم‌ها + امتیاز و کامنت ادمین' },
  { key: 'okrs', label: 'تعریف OKRها', desc: 'اهداف، نتایج کلیدی و سهم/وزن هر تیم + درصد پیشرفت فعلی' },
  { key: 'teams', label: 'تیم‌ها', desc: 'تیم‌ها، مسئولین و اعضا' },
  { key: 'users', label: 'کاربران', desc: 'فهرست کاربران، نقش‌ها و تیم‌ها' },
];

const FORMATS = [
  { key: 'csv', label: 'CSV', style: 'bg-emerald-600 hover:bg-emerald-700' },
  { key: 'json', label: 'JSON', style: 'bg-primary hover:bg-primary/90' },
  { key: 'md', label: 'Markdown', style: 'bg-violet-600 hover:bg-violet-700' },
];

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">خروجی گرفتن از داده‌ها</h1>
        <p className="text-sm text-muted-foreground">
          هر دیتاست را جداگانه و در فرمت دلخواه دانلود کنید.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>گزارش کامل Excel</CardTitle>
            <CardDescription>دو شیت: خلاصه‌ی تیم‌ها + جزئیات آخرین وضعیت همه‌ی KRها</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/api/admin/export/excel"
              className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              دانلود Excel
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>گزارش چاپی / PDF</CardTitle>
            <CardDescription>صفحه‌ی گزارش با دکمه‌ی چاپ مرورگر (ذخیره به PDF)</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/report"
              className="inline-block rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              باز کردن گزارش
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>خروجی تفکیک‌شده‌ی داده‌ها</CardTitle>
          <CardDescription>CSV برای اکسل/شیت، JSON برای سیستم‌های دیگر، Markdown برای مستندسازی</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DATASETS.map((d) => (
            <div
              key={d.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div>
                <p className="font-medium">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.desc}</p>
              </div>
              <div className="flex gap-2">
                {FORMATS.map((f) => (
                  <a
                    key={f.key}
                    href={`/api/admin/export/data?dataset=${d.key}&format=${f.key}`}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${f.style}`}
                  >
                    {f.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
