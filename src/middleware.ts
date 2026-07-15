import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // RBAC: مسیرهای ادمین فقط برای ADMIN
    if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && token?.role !== 'ADMIN') {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/team', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: '/login' },
  }
);

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/team/:path*',
    '/settings',
    '/change-password',
    '/api/push/:path*',
    '/api/admin/:path*',
    '/api/team/:path*',
  ],
};
