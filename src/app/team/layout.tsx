import { redirect } from 'next/navigation';
import { AppNav } from '@/components/nav';
import { PasswordBanner } from '@/components/password-banner';
import { getSession } from '@/lib/auth';
import { currentQuarterInfo } from '@/lib/jalali';

const links = [
  { href: '/team', label: 'OKRهای من' },
  { href: '/team/checkin', label: 'ثبت وضعیت هفتگی' },
];

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen">
      <AppNav
        title="پنل تیم — OKR"
        subtitle={currentQuarterInfo().label}
        links={links}
        userName={session.user.fullName}
      />
      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <PasswordBanner />
        {children}
      </main>
    </div>
  );
}
