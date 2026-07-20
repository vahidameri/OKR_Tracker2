import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PushPrompt } from '@/components/push-prompt';
import { ChangePasswordForm } from '@/components/settings/change-password-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSession } from '@/lib/auth';
import { formatJalaliDateTime } from '@/lib/jalali';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teams: { include: { team: { select: { name: true } } } },
      sessions: { orderBy: { loginAt: 'desc' }, take: 5 },
    },
  });
  if (!user) redirect('/login');

  const backHref = session.user.role === 'ADMIN' ? '/admin' : '/team';

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black">تنظیمات کاربری</h1>
        <Link href={backHref} className="text-sm text-primary hover:underline">
          ← بازگشت به پنل
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>مشخصات حساب</CardTitle>
          <CardDescription>نام کاربری قابل تغییر نیست.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">نام کاربری: </span>
            <span dir="ltr" className="font-mono">{user.username}</span>
          </p>
          <p>
            <span className="text-muted-foreground">نام: </span>
            {user.fullName}
          </p>
          <p>
            <span className="text-muted-foreground">نقش: </span>
            {user.role === 'ADMIN' ? 'ادمین (مدیریت)' : 'عضو تیم'}
          </p>
          {user.teams.length > 0 && (
            <p className="flex flex-wrap items-center gap-1">
              <span className="text-muted-foreground">تیم‌ها: </span>
              {user.teams.map((t) => (
                <Badge key={t.id} className="bg-blue-50 text-blue-800">
                  {t.team.name}
                </Badge>
              ))}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تغییر رمز عبور</CardTitle>
          {session.user.mustChangePassword && (
            <CardDescription className="text-amber-700">
              شما هنوز از پسورد اولیه استفاده می‌کنید؛ پیشنهاد می‌شود همین حالا تغییرش دهید.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>یادآوری چک‌این (پوش نوتیفیکیشن)</CardTitle>
          <CardDescription>
            روزهای شنبه تا یک‌شنبه ساعت ۱۰ صبح، اگر چک‌این هفته‌ی تیم‌تان ثبت نشده باشد، مرورگر یادآوری می‌دهد.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushPrompt />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ورودهای اخیر شما</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {user.sessions.map((s) => (
            <p key={s.id} className="text-muted-foreground">
              {formatJalaliDateTime(s.loginAt)}
              {s.ipAddress ? ` — ${s.ipAddress}` : ''}
            </p>
          ))}
          {user.sessions.length === 0 && <p className="text-muted-foreground">موردی ثبت نشده است.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
