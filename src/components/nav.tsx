'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavLink {
  href: string;
  label: string;
}

export function AppNav({
  title,
  links,
  userName,
}: {
  title: string;
  links: NavLink[];
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="text-sm font-black text-primary">{title}</span>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === pathname ||
              (link.href !== '/admin' && link.href !== '/team' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  active ? 'bg-primary/10 font-bold text-primary' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mr-auto flex items-center gap-3">
          <Link
            href="/settings"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            title="تنظیمات کاربری"
          >
            ⚙ {userName}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  );
}
