import { redirect } from 'next/navigation';
import { AppSidebar, type SideEntry } from '@/components/app-sidebar';
import { PasswordBanner } from '@/components/password-banner';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/roles';

const links: SideEntry[] = [
  { href: '/admin', label: 'داشبورد', icon: 'dashboard' },
  { href: '/admin/summary', label: 'خلاصه هفته', icon: 'summary' },
  { href: '/admin/okrs', label: 'مدیریت OKR', icon: 'okrs' },
  { href: '/admin/checkins', label: 'گزارش‌های هفتگی', icon: 'checkins' },
  { href: '/admin/compare', label: 'مقایسه دوره‌ها', icon: 'compare' },
  { href: '/admin/audit', label: 'تاریخچه تغییرات', icon: 'audit' },
  {
    label: 'تنظیمات و پیکربندی',
    icon: 'settings',
    children: [
      { href: '/admin/cycles', label: 'تعریف دوره‌ها', icon: 'cycles' },
      { href: '/admin/import', label: 'آپلود اکسل', icon: 'import' },
      { href: '/admin/export', label: 'خروجی‌ها', icon: 'export' },
      { href: '/admin/users', label: 'کاربران', icon: 'users' },
      { href: '/admin/settings', label: 'تنظیمات عمومی', icon: 'settings' },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  if (!isAdminRole(session.user.role)) redirect('/team');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { title: true },
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar
        title="پنل مدیریت OKR"
        links={links}
        userName={session.user.fullName}
        roleLabel={dbUser?.title ?? 'ادمین'}
        homeHref="/admin"
      />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl p-5 md:p-8">
          <PasswordBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
