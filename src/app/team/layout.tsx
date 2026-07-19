import { redirect } from 'next/navigation';
import { AppShell, type NavGroup } from '@/components/app-shell';
import { PasswordBanner } from '@/components/password-banner';
import { getSession } from '@/lib/auth';

const groups: NavGroup[] = [
  {
    links: [
      { href: '/team', label: 'OKRهای من', icon: 'compass' },
      { href: '/team/checkin', label: 'ثبت وضعیت هفتگی', icon: 'refresh-cw' },
    ],
  },
];

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  return (
    <AppShell
      title="سامانه OKR"
      subtitle="پنل تیم"
      groups={groups}
      userName={session.user.fullName}
      userRole="عضو تیم"
    >
      <PasswordBanner />
      {children}
    </AppShell>
  );
}
