import { redirect } from 'next/navigation';
import { AppShell, type NavGroup } from '@/components/app-shell';
import { PasswordBanner } from '@/components/password-banner';
import { getSession } from '@/lib/auth';

const groups: NavGroup[] = [
  {
    label: 'نمای کلی',
    links: [
      { href: '/admin', label: 'داشبورد', icon: 'gauge' },
      { href: '/admin/summary', label: 'خلاصه هفته', icon: 'clipboard-list' },
      { href: '/admin/compare', label: 'مقایسه دوره‌ها', icon: 'chart-scatter' },
      { href: '/admin/audit', label: 'تاریخچه تغییرات', icon: 'archive' },
    ],
  },
  {
    label: 'اهداف و گزارش‌ها',
    links: [
      { href: '/admin/okrs', label: 'مدیریت OKR', icon: 'list-checks' },
      { href: '/admin/checkins', label: 'گزارش‌های هفتگی', icon: 'refresh-cw' },
      { href: '/admin/import', label: 'آپلود اکسل', icon: 'file-spreadsheet' },
      { href: '/admin/export', label: 'خروجی‌ها', icon: 'download' },
    ],
  },
  {
    label: 'سازمان',
    links: [
      { href: '/admin/users', label: 'کاربران', icon: 'users' },
      { href: '/admin/settings', label: 'تنظیمات', icon: 'settings' },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/team');

  return (
    <AppShell
      title="سامانه OKR"
      subtitle="پنل مدیریت"
      groups={groups}
      userName={session.user.fullName}
      userRole="مدیر سیستم"
    >
      <PasswordBanner />
      {children}
    </AppShell>
  );
}
