import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createUserSchema } from '@/lib/validations';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
      teams: { include: { team: { select: { id: true, name: true } } } },
      _count: { select: { sessions: true } },
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const username = parsed.data.username.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: 'این نام کاربری قبلاً ثبت شده است' }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      username,
      fullName: parsed.data.fullName,
      passwordHash: await hash(parsed.data.password, 10),
      role: parsed.data.role,
      mustChangePassword: true,
      teams: { create: parsed.data.teamIds.map((teamId) => ({ teamId })) },
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
