import { FeedbackForm } from '@/components/admin/feedback-form';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatJalali, formatJalaliDateTime } from '@/lib/jalali';
import { prisma } from '@/lib/prisma';
import { formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CheckInsReviewPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
  const teamFilter = searchParams.team;

  const checkIns = await prisma.weeklyCheckIn.findMany({
    where: teamFilter ? { teamKeyResult: { teamId: teamFilter } } : undefined,
    orderBy: [{ weekStartDate: 'desc' }, { submittedAt: 'desc' }],
    take: 100,
    include: {
      feedback: true,
      submittedBy: { select: { fullName: true } },
      teamKeyResult: {
        include: {
          team: { select: { id: true, name: true } },
          keyResult: { select: { title: true, metricType: true, unit: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">گزارش‌های هفتگی تیم‌ها</h1>
        <p className="text-sm text-muted-foreground">
          امتیازدهی و کامنت‌گذاری روی چک‌این‌های هفتگی (۱۰۰ مورد اخیر)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/checkins"
          className={`rounded-full px-3 py-1 text-sm ${!teamFilter ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-muted'}`}
        >
          همه تیم‌ها
        </a>
        {teams.map((t) => (
          <a
            key={t.id}
            href={`/admin/checkins?team=${t.id}`}
            className={`rounded-full px-3 py-1 text-sm ${teamFilter === t.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-muted'}`}
          >
            {t.name}
          </a>
        ))}
      </div>

      {checkIns.length === 0 && (
        <Card>
          <CardContent className="pt-5 text-center text-muted-foreground">چک‌اینی ثبت نشده است.</CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {checkIns.map((c) => {
          const kr = c.teamKeyResult.keyResult;
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm">
                    {c.teamKeyResult.team.name} — {kr.title}
                  </CardTitle>
                  <StatusBadge status={c.progressStatus} />
                </div>
                <CardDescription>
                  هفته {formatJalali(c.weekStartDate)} · ثبت توسط {c.submittedBy?.fullName ?? '—'} در{' '}
                  {formatJalaliDateTime(c.submittedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  {kr.metricType === 'NUMERIC' && (
                    <p>
                      مقدار فعلی: <b>{formatCompact(c.currentValue)}</b> {kr.unit ?? ''}
                    </p>
                  )}
                  {kr.metricType === 'BOOLEAN' && <p>وضعیت: <b>{c.booleanValue ? 'بله (انجام شد)' : 'خیر'}</b></p>}
                  {kr.metricType === 'TEXT' && <p className="whitespace-pre-wrap">{c.textValue}</p>}
                  {c.blockerDescription && (
                    <p className="mt-1 rounded-md bg-red-50 p-2 text-red-800">بلاکر: {c.blockerDescription}</p>
                  )}
                </div>
                <FeedbackForm
                  checkInId={c.id}
                  initialScore={c.feedback?.score ?? null}
                  initialComment={c.feedback?.comment ?? null}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
