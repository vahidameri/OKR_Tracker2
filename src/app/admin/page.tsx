import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TeamBarChart } from '@/components/charts/team-bar-chart';
import { TrendChart } from '@/components/charts/trend-chart';
import { formatJalali, formatJalaliLong } from '@/lib/jalali';
import { getDepartmentOverview, getWeeklyTrend } from '@/lib/okr-data';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [{ overviews, departmentProgress, totalTkrs }, trend] = await Promise.all([
    getDepartmentOverview(),
    getWeeklyTrend(),
  ]);

  const totals = overviews.reduce(
    (acc, o) => ({
      onTrack: acc.onTrack + o.statusCounts.ON_TRACK,
      atRisk: acc.atRisk + o.statusCounts.AT_RISK,
      blocked: acc.blocked + o.statusCounts.BLOCKED,
      completed: acc.completed + o.statusCounts.COMPLETED,
    }),
    { onTrack: 0, atRisk: 0, blocked: 0, completed: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">داشبورد دپارتمان</h1>
          <p className="text-sm text-muted-foreground">{formatJalaliLong(new Date())}</p>
        </div>
        <div className="no-print flex gap-2">
          <a
            href="/api/admin/export/excel"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            خروجی Excel
          </a>
          <Link
            href="/admin/report"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            گزارش چاپی / PDF
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-1">
          <CardContent className="pt-5 text-center">
            <p className="text-3xl font-black text-primary">{departmentProgress}٪</p>
            <p className="mt-1 text-sm text-muted-foreground">پیشرفت وزنی کل دپارتمان</p>
          </CardContent>
        </Card>
        {[
          { label: 'در مسیر', value: totals.onTrack, color: 'text-emerald-600' },
          { label: 'در ریسک', value: totals.atRisk, color: 'text-amber-600' },
          { label: 'بلاک‌شده', value: totals.blocked, color: 'text-red-600' },
          { label: 'تکمیل‌شده', value: totals.completed, color: 'text-blue-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 text-center">
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">KR {s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>پیشرفت تیم‌ها</CardTitle>
            <CardDescription>میانگین وزنی پیشرفت KRهای هر تیم ({totalTkrs} رکورد KR-تیم)</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamBarChart data={overviews.map((o) => ({ name: o.teamName, progress: o.progress }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>روند هفتگی دپارتمان</CardTitle>
            <CardDescription>پیشرفت وزنی تجمیعی هفته‌به‌هفته</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overviews.map((o) => (
          <Link key={o.teamId} href={`/admin/teams/${o.teamId}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>{o.teamName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{o.krCount} KR</span>
                </CardTitle>
                <CardDescription>مسئول: {o.leadName ?? '—'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProgressBar value={o.progress} />
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                    در مسیر: {o.statusCounts.ON_TRACK}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    ریسک: {o.statusCounts.AT_RISK}
                  </span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">
                    بلاک: {o.statusCounts.BLOCKED}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
                    تکمیل: {o.statusCounts.COMPLETED}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  آخرین چک‌این: {o.lastCheckInAt ? formatJalali(o.lastCheckInAt) : 'ثبت نشده'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
