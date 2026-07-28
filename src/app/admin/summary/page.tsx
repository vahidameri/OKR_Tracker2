import Link from 'next/link';
import { PrintButton } from '@/app/admin/report/print-button';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pct } from '@/components/ui/pct';
import { formatJalali, formatJalaliLong, getWeekStart } from '@/lib/jalali';
import {
  computePersistentBlockers,
  computeTrend,
  getDepartmentOverview,
} from '@/lib/okr-data';
import { AUTO_STATUS_LABELS } from '@/lib/progress';

export const dynamic = 'force-dynamic';

/** خلاصه‌ی خودکار هفته برای مدیر دپارتمان و مدیر برنامه — قابل چاپ */
export default async function WeeklySummaryPage() {
  const { overviews, departmentProgress, tkrs } = await getDepartmentOverview();
  const trend = computeTrend(tkrs);
  const persistentBlockers = computePersistentBlockers(tkrs);
  const weekStartIso = getWeekStart().toISOString();

  const teamsWithKrs = overviews.filter((o) => o.krCount > 0);
  const onOrAhead = teamsWithKrs.filter((o) => o.autoStatus === 'ON_SCHEDULE' || o.autoStatus === 'AHEAD');
  const behind = teamsWithKrs.filter((o) => o.autoStatus === 'AT_RISK' || o.autoStatus === 'BEHIND');

  const notSubmitted = teamsWithKrs
    .map((o) => {
      const teamTkrs = tkrs.filter((t) => t.teamId === o.teamId);
      const submitted = teamTkrs.filter((t) =>
        t.checkIns.some((c) => c.weekStartDate.toISOString() === weekStartIso)
      ).length;
      return { ...o, submitted, total: teamTkrs.length };
    })
    .filter((o) => o.submitted < o.total);

  const openBlockers = tkrs
    .filter((t) => t.checkIns[0]?.progressStatus === 'BLOCKED')
    .map((t) => ({
      teamName: t.team.name,
      krTitle: t.keyResult.title,
      blocker: t.checkIns[0]?.blockerDescription ?? null,
      persistent: persistentBlockers.some((p) => p.teamId === t.teamId && p.krTitle === t.keyResult.title),
    }));

  const delta = trend.length >= 2 ? trend[trend.length - 1].progress - trend[trend.length - 2].progress : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">خلاصه‌ی وضعیت هفته — دپارتمان محصول و تکنولوژی</h1>
          <p className="text-sm text-muted-foreground">
            هفته‌ی {formatJalali(new Date(weekStartIso))} · گزارش خودکار {formatJalaliLong(new Date())}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/report" className="group">
          <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-black text-primary"><Pct value={departmentProgress} /></p>
              <p className="mt-1 text-sm text-muted-foreground">پیشرفت دپارتمان</p>
              {delta !== null && (
                <p className={`text-xs font-bold ${delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} واحد نسبت به هفته قبل
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin" className="group">
          <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-black text-teal-700">{onOrAhead.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">تیم در مسیر / جلوتر</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin" className="group">
          <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-black text-red-700">{behind.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">تیم در ریسک / عقب</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/checkins" className="group">
          <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-black text-amber-700">{notSubmitted.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">تیم با چک‌این ناقص این هفته</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>وضعیت زمانی تیم‌ها</CardTitle>
            <CardDescription>محاسبه‌ی خودکار بر اساس فاصله از برنامه</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {teamsWithKrs.map((o) => (
              <div key={o.teamId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link href={`/admin/teams/${o.teamId}`} className="font-medium hover:text-primary">
                  {o.teamName}
                </Link>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Pct value={o.progress} /> از {o.expected ?? '—'}٪ انتظار
                  <AutoStatusBadge status={o.autoStatus} expected={o.expected} />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>چک‌این‌های ثبت‌نشده‌ی این هفته</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notSubmitted.length === 0 ? (
              <p className="text-sm text-emerald-700">✔ همه‌ی تیم‌ها چک‌این این هفته را کامل ثبت کرده‌اند.</p>
            ) : (
              notSubmitted.map((o) => (
                <div key={o.teamId} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{o.teamName}</span>
                  <span className="text-xs text-amber-800">
                    {o.submitted} از {o.total} KR ثبت شده
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بلاکرهای باز</CardTitle>
          <CardDescription>KRهایی که آخرین وضعیت‌شان «بلاک‌شده» است — بلاکرهای پایدار برجسته‌اند</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {openBlockers.length === 0 ? (
            <p className="text-sm text-emerald-700">✔ در حال حاضر بلاکر بازی ثبت نشده است.</p>
          ) : (
            openBlockers.map((b, i) => (
              <div
                key={i}
                className={`rounded-md border p-3 text-sm ${b.persistent ? 'border-red-300 bg-red-50' : 'border-border'}`}
              >
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {b.teamName} — {b.krTitle}
                  <StatusBadge status="BLOCKED" />
                  {b.persistent && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">🔁 بلاکر پایدار</span>
                  )}
                </p>
                {b.blocker && <p className="mt-1 text-xs text-red-800">{b.blocker}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        راهنما: وضعیت زمانی خودکار = مقایسه‌ی پیشرفت واقعی با نسبت زمان سپری‌شده از دوره (
        {Object.values(AUTO_STATUS_LABELS).join(' / ')}). آستانه‌ها از صفحه‌ی «تنظیمات» قابل تغییرند.
      </p>
    </div>
  );
}
