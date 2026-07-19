import { redirect } from 'next/navigation';
import { AppNav } from '@/components/nav';
import { PasswordBanner } from '@/components/password-banner';
import { getSession } from '@/lib/auth';
import { currentQuarterInfo } from '@/lib/jalali';

const links = [
  { href: '/admin', label: 'داشبورد' },
  { href: '/admin/summary', label: 'خلاصه هفته' },
  { href: '/admin/okrs', label: 'مدیریت OKR' },
  { href: '/admin/import', label: 'آپلود اکسل' },
  { href: '/admin/checkins', label: 'گزارش‌های هفتگی' },
  { href: '/admin/compare', label: 'مقایسه دوره‌ها' },
  { href: '/admin/audit', label: 'تاریخچه تغییرات' },
  { href: '/admin/export', label: 'خروجی‌ها' },
  { href: '/admin/users', label: 'کاربران' },
  { href: '/admin/settings', label: 'تنظیمات' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/team');

  return (
    <div className="min-h-screen">
      <AppNav
        title="پنل مدیریت OKR"
        subtitle={currentQuarterInfo().label}
        links={links}
        userName={session.user.fullName}
      />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <PasswordBanner />
        {children}
      </main>
    </div>
  );
}
