import { compare } from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/roles';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 12 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'نام کاربری', type: 'text' },
        password: { label: 'رمز عبور', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username.trim().toLowerCase() },
        });
        if (!user || !user.isActive) return null;

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // ثبت نشست برای بخش «نشست‌های کاربر» در پنل ادمین
        const headers = req?.headers ?? {};
        const forwardedFor = (headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
        const sessionRecord = await prisma.userSession.create({
          data: {
            userId: user.id,
            ipAddress: forwardedFor || (headers['x-real-ip'] as string | undefined) || null,
            userAgent: (headers['user-agent'] as string | undefined) ?? null,
          },
        });

        return {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          sessionRecordId: sessionRecord.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.fullName = user.fullName;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
        token.sessionRecordId = user.sessionRecordId;
      }
      // پس از تغییر پسورد، فلگ توکن به‌روز شود
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({ where: { id: token.id } });
        if (fresh) token.mustChangePassword = fresh.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        username: token.username,
        fullName: token.fullName,
        role: token.role,
        mustChangePassword: token.mustChangePassword,
      };
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sessionRecordId) {
        await prisma.userSession
          .update({ where: { id: token.sessionRecordId }, data: { logoutAt: new Date() } })
          .catch(() => undefined);
      }
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}

/** برای route handlerها: نشست معتبر ادمین یا خطای 401/403 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) return { error: 'unauthorized' as const, session: null };
  if (!isAdminRole(session.user.role)) return { error: 'forbidden' as const, session: null };
  return { error: null, session };
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) return { error: 'unauthorized' as const, session: null };
  return { error: null, session };
}

/** بررسی عضویت کاربر جاری در یک تیم (ادمین‌ها به همه‌ی تیم‌ها دسترسی دارند) */
export async function canAccessTeam(userId: string, role: string, teamId: string) {
  if (isAdminRole(role)) return true;
  const membership = await prisma.userTeam.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  return !!membership;
}
