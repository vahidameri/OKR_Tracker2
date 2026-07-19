'use client';

import {
  Activity,
  Archive,
  Bell,
  Calendar,
  ChartScatter,
  ClipboardList,
  Compass,
  Download,
  FileSpreadsheet,
  Flame,
  Gauge,
  ListChecks,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/** آیکون‌ها با نام رشته‌ای پاس داده می‌شوند تا از لایه‌ی سرور قابل ارسال باشند */
const ICONS: Record<string, LucideIcon> = {
  gauge: Gauge,
  compass: Compass,
  'list-checks': ListChecks,
  'clipboard-list': ClipboardList,
  'chart-scatter': ChartScatter,
  'trending-up': TrendingUp,
  activity: Activity,
  archive: Archive,
  download: Download,
  'file-spreadsheet': FileSpreadsheet,
  'refresh-cw': RefreshCw,
  users: Users,
  settings: Settings,
  calendar: Calendar,
};

export interface NavLink {
  href: string;
  label: string;
  icon: string;
}

export interface NavGroup {
  label?: string;
  links: NavLink[];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('');
}

function NavItem({ link, onNavigate }: { link: NavLink; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active =
    link.href === pathname ||
    (link.href !== '/admin' && link.href !== '/team' && pathname.startsWith(link.href));
  const Icon = ICONS[link.icon] ?? Compass;

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-muted/70 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 2} />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}

function SidebarContent({
  title,
  subtitle,
  groups,
  userName,
  userRole,
  onNavigate,
}: {
  title: string;
  subtitle: string;
  groups: NavGroup[];
  userName: string;
  userRole: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* لوگو */}
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Flame className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black leading-tight">{title}</span>
          <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
        </span>
      </div>

      {/* ناوبری */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-1">
        {groups.map((group, i) => (
          <div key={i} className="space-y-0.5">
            {group.label && (
              <p className="px-3 pb-1 text-[11px] font-bold tracking-wide text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.links.map((link) => (
              <NavItem key={link.href} link={link} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      {/* کاربر */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initials(userName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{userName}</span>
            <span className="block truncate text-xs text-muted-foreground">{userRole}</span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="خروج از حساب"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  groups,
  userName,
  userRole,
  children,
}: {
  title: string;
  subtitle: string;
  groups: NavGroup[];
  userName: string;
  userRole: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      {/* سایدبار دسکتاپ */}
      <aside className="no-print fixed inset-y-0 start-0 z-30 hidden w-64 border-e border-sidebar-border bg-sidebar md:block">
        <SidebarContent
          title={title}
          subtitle={subtitle}
          groups={groups}
          userName={userName}
          userRole={userRole}
        />
      </aside>

      {/* سایدبار موبایل (کشویی) */}
      {open && (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-72 border-e border-sidebar-border bg-sidebar shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute end-2 top-3 rounded-md p-2 text-muted-foreground hover:bg-muted"
              title="بستن منو"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
              title={title}
              subtitle={subtitle}
              groups={groups}
              userName={userName}
              userRole={userRole}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="md:ms-64">
        {/* هدر */}
        <header className="no-print sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 md:px-6">
            <button
              onClick={() => setOpen(true)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
              title="منو"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate text-sm font-bold md:hidden">{title}</span>
            <div className="ms-auto flex items-center gap-1.5">
              <Link
                href="/settings"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="اعلان‌ها و یادآورها"
              >
                <Bell className="h-[18px] w-[18px]" />
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-muted"
                title="تنظیمات کاربری"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {initials(userName)}
                </span>
                <span className="hidden text-sm font-medium sm:block">{userName}</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
