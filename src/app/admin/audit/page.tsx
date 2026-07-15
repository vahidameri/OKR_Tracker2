import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { AUDIT_ENTITY_LABELS, type AuditEntityType } from '@/lib/audit';
import { formatJalaliDateTime } from '@/lib/jalali';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const FILTERS: { key: string; label: string }[] = [
  { key: '', label: 'همه' },
  { key: 'OBJECTIVE', label: 'اهداف' },
  { key: 'KEY_RESULT', label: 'نتایج کلیدی' },
  { key: 'TEAM_KEY_RESULT', label: 'سهم‌های تیمی' },
];

export default async function AuditLogPage({ searchParams }: { searchParams: { type?: string } }) {
  const type = searchParams.type && searchParams.type in AUDIT_ENTITY_LABELS ? searchParams.type : undefined;

  const logs = await prisma.okrAuditLog.findMany({
    where: type ? { entityType: type } : undefined,
    orderBy: { changedAt: 'desc' },
    take: 200,
    include: { changedBy: { select: { fullName: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">تاریخچه‌ی تغییرات OKR</h1>
        <p className="text-sm text-muted-foreground">
          هر تغییر در تعریف اهداف، نتایج کلیدی و وزن/تارگت تیمی این‌جا ثبت می‌شود (۲۰۰ مورد اخیر).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <a
            key={f.key}
            href={f.key ? `/admin/audit?type=${f.key}` : '/admin/audit'}
            className={`rounded-full px-3 py-1 text-sm ${
              (type ?? '') === f.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card hover:bg-muted'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">هنوز تغییری ثبت نشده است.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>زمان</TH>
                  <TH>کاربر</TH>
                  <TH>نوع</TH>
                  <TH>مورد</TH>
                  <TH>فیلد</TH>
                  <TH>مقدار قبلی</TH>
                  <TH>مقدار جدید</TH>
                </TR>
              </THead>
              <TBody>
                {logs.map((log) => (
                  <TR key={log.id}>
                    <TD className="whitespace-nowrap text-xs">{formatJalaliDateTime(log.changedAt)}</TD>
                    <TD className="text-xs">{log.changedBy?.fullName ?? '—'}</TD>
                    <TD>
                      <Badge className="bg-muted text-foreground">
                        {AUDIT_ENTITY_LABELS[log.entityType as AuditEntityType] ?? log.entityType}
                      </Badge>
                    </TD>
                    <TD className="max-w-52 text-xs">{log.entityLabel}</TD>
                    <TD className="text-xs font-medium">{log.field}</TD>
                    <TD className="max-w-36 text-xs text-red-700">{log.oldValue ?? '—'}</TD>
                    <TD className="max-w-36 text-xs text-emerald-700">{log.newValue ?? '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">چرا این صفحه مهم است؟</CardTitle>
          <CardDescription>
            وقتی وسط دوره تارگت یا وزن عوض می‌شود، تحلیل روند بدون این تاریخچه گمراه‌کننده است. هر ردیف نشان
            می‌دهد چه چیزی، کِی، توسط چه کسی و از چه مقداری به چه مقداری تغییر کرده.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
