'use client';

import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Download,
  FileClock,
  GitCompareArrows,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessagesSquare,
  Settings,
  Target,
  Upload,
  Users,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  summary: ClipboardList,
  okrs: Target,
  import: Upload,
  checkins: MessagesSquare,
  compare: GitCompareArrows,
  audit: FileClock,
  export: Download,
  users: Users,
  settings: Settings,
  cycles: CalendarDays,
  myokrs: ListChecks,
  checkin: CalendarRange,
};

export interface SideLink {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

function NavItem({ link, active }: { link: SideLink; active: boolean }) {
  const Icon = ICONS[link.icon] ?? Target;
  return (
    <Link
      href={link.href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
        active
          ? 'bg-sidebar-active font-bold text-white shadow-sm'
          : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white'
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {link.label}
    </Link>
  );
}

export function AppSidebar({
  title,
  quarterLabel,
  links,
  userName,
  roleLabel,
  homeHref,
}: {
  title: string;
  quarterLabel: string;
  links: SideLink[];
  userName: string;
  roleLabel: string;
  homeHref: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === pathname ||
    (href !== '/admin' && href !== '/team' && pathname.startsWith(href));

  // خروج به همان مبدأ فعلی (پورت/دامنه) تا روی 3000 نپرد
  const logout = () =>
    signOut({ callbackUrl: `${window.location.origin}/login` });

  return (
    <>
      {/* سایدبار دسکتاپ */}
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar md:flex">
        <Link href={homeHref} className="block border-b border-white/10 px-4 py-4 text-center hover:bg-sidebar-hover">
          <span className="inline-block rounded-xl bg-white px-3 py-1.5">
            <Logo className="h-10 w-auto" />
          </span>
          <p className="mt-2 text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-[11px] leading-5 text-sidebar-foreground">{quarterLabel}</p>
        </Link>

        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
          {links.map((link) => (
            <NavItem key={link.href} link={link} active={isActive(link.href)} />
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 hover:bg-sidebar-hover"
              title="تنظیمات کاربری"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                {userName.trim().charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-white">{userName}</span>
                <span className="block text-[11px] text-sidebar-foreground">{roleLabel}</span>
              </span>
            </Link>
            <button
              onClick={logout}
              className="rounded-xl p-2 text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
              title="خروج"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* نوار موبایل */}
      <header className="no-scrollbar no-print sticky top-0 z-20 flex items-center gap-2 overflow-x-auto bg-sidebar px-3 py-2 md:hidden">
        <Link href={homeHref} className="shrink-0">
          <Logo className="h-7 w-auto rounded bg-white p-0.5" />
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'shrink-0 rounded-lg px-2.5 py-1.5 text-xs',
              isActive(link.href) ? 'bg-sidebar-active font-bold text-white' : 'text-sidebar-foreground'
            )}
          >
            {link.label}
          </Link>
        ))}
        <span className="mr-auto flex shrink-0 items-center gap-1">
          <Link href="/settings" className="rounded-lg px-2 py-1.5 text-xs text-sidebar-foreground">
            ⚙ {userName}
          </Link>
          <button
            onClick={logout}
            className="rounded-lg px-2 py-1.5 text-xs text-sidebar-foreground"
          >
            خروج
          </button>
        </span>
      </header>
    </>
  );
}
