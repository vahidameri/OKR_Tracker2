import { redirect } from 'next/navigation';
import { AppSidebar, type SideLink } from '@/components/app-sidebar';
import { PasswordBanner } from '@/components/password-banner';
import { getSession } from '@/lib/auth';
import { currentQuarterInfo } from '@/lib/jalali';
import { prisma } from '@/lib/prisma';

const links: SideLink[] = [
  { href: '/team', label: 'OKRهای من', icon: 'myokrs' },
  { href: '/team/checkin', label: 'ثبت وضعیت هفتگی', icon: 'checkin' },
];

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { title: true },
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar
        title="پنل تیم — OKR"
        quarterLabel={currentQuarterInfo().label}
        links={links}
        userName={session.user.fullName}
        roleLabel={dbUser?.title ?? (session.user.role === 'ADMIN' ? 'ادمین' : 'عضو تیم')}
        homeHref="/team"
      />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl p-5 md:p-8">
          <PasswordBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
