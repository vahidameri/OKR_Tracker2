import { redirect } from 'next/navigation';
import { AppNav } from '@/components/nav';
import { getSession } from '@/lib/auth';

const links = [
  { href: '/admin', label: 'داشبورد' },
  { href: '/admin/okrs', label: 'مدیریت OKR' },
  { href: '/admin/import', label: 'آپلود اکسل' },
  { href: '/admin/checkins', label: 'گزارش‌های هفتگی' },
  { href: '/admin/users', label: 'کاربران' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/team');

  return (
    <div className="min-h-screen">
      <AppNav title="پنل مدیریت OKR" links={links} userName={session.user.fullName} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </div>
  );
}
