import { CommentThread } from '@/components/comment-thread';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { ViewToggle } from '@/components/view-toggle';
import { formatJalali, formatJalaliDateTime } from '@/lib/jalali';
import { prisma } from '@/lib/prisma';
import { formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const VALID_STATUS = ['ON_TRACK', 'AT_RISK', 'BLOCKED', 'COMPLETED'] as const;

export default async function CheckInsReviewPage({
  searchParams,
}: {
  searchParams: { team?: string; view?: string; status?: string };
}) {
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
  const teamFilter = searchParams.team;
  const statusFilter = (VALID_STATUS as readonly string[]).includes(searchParams.status ?? '')
    ? (searchParams.status as (typeof VALID_STATUS)[number])
    : undefined;
  const view: 'cards' | 'table' = searchParams.view === 'table' ? 'table' : 'cards';
  const teamQuery = teamFilter ? `team=${teamFilter}&` : '';

  const checkIns = await prisma.weeklyCheckIn.findMany({
    where: {
      ...(teamFilter ? { teamKeyResult: { teamId: teamFilter } } : {}),
      ...(statusFilter ? { progressStatus: statusFilter } : {}),
    },
    orderBy: [{ weekStartDate: 'desc' }, { submittedAt: 'desc' }],
    take: 100,
    include: {
      submittedBy: { select: { fullName: true } },
      editedBy: { select: { fullName: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { fullName: true, role: true } } },
      },
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
          مرور و کامنت‌گذاری روی چک‌این‌های هفتگی (۱۰۰ مورد اخیر)
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/checkins${view === 'table' ? '?view=table' : ''}`}
            className={`rounded-full px-3 py-1 text-sm ${!teamFilter ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-muted'}`}
          >
            همه تیم‌ها
          </a>
          {teams.map((t) => (
            <a
              key={t.id}
              href={`/admin/checkins?team=${t.id}${view === 'table' ? '&view=table' : ''}`}
              className={`rounded-full px-3 py-1 text-sm ${teamFilter === t.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-muted'}`}
            >
              {t.name}
            </a>
          ))}
        </div>
        <ViewToggle
          view={view}
          hrefCards={`/admin/checkins?${teamQuery}`.replace(/[?&]$/, '') || '/admin/checkins'}
          hrefTable={`/admin/checkins?${teamQuery}view=table`}
        />
      </div>

      {view === 'table' && checkIns.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <THead>
                <TR>
                  <TH>تیم</TH>
                  <TH>نتیجه کلیدی</TH>
                  <TH>هفته</TH>
                  <TH>مقدار / گزارش</TH>
                  <TH>وضعیت</TH>
                  <TH>ثبت‌کننده</TH>
                </TR>
              </THead>
              <TBody>
                {checkIns.map((c) => {
                  const kr = c.teamKeyResult.keyResult;
                  return (
                    <TR key={c.id}>
                      <TD className="text-xs">{c.teamKeyResult.team.name}</TD>
                      <TD className="max-w-52 text-xs">{kr.title}</TD>
                      <TD className="text-xs">{formatJalali(c.weekStartDate)}</TD>
                      <TD className="max-w-48 text-xs">
                        {kr.metricType === 'NUMERIC' && `${formatCompact(c.currentValue)} ${kr.unit ?? ''}`}
                        {kr.metricType === 'BOOLEAN' && (c.booleanValue ? 'بله' : 'خیر')}
                        {kr.metricType === 'TEXT' && (c.textValue ?? '—')}
                        {c.blockerDescription && (
                          <p className="mt-1 text-red-700">بلاکر: {c.blockerDescription}</p>
                        )}
                      </TD>
                      <TD>
                        <StatusBadge status={c.progressStatus} />
                      </TD>
                      <TD className="text-xs">{c.submittedBy?.fullName ?? '—'}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {checkIns.length === 0 && (
        <Card>
          <CardContent className="pt-5 text-center text-muted-foreground">چک‌اینی ثبت نشده است.</CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {view === 'cards' &&
          checkIns.map((c) => {
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
                  {c.isEdited && (
                    <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                      ✎ ویرایش‌شده توسط {c.editedBy?.fullName ?? 'ادمین'}
                      {c.editedAt ? ` — ${formatJalaliDateTime(c.editedAt)}` : ''}
                    </span>
                  )}
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
                <CommentThread
                  checkInId={c.id}
                  comments={c.comments.map((cm) => ({
                    id: cm.id,
                    body: cm.body,
                    createdAt: cm.createdAt.toISOString(),
                    authorName: cm.author?.fullName ?? null,
                    authorRole: cm.author?.role ?? null,
                  }))}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
