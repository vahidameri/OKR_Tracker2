import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { invalidateCyclesCache } from '@/lib/cycles';
import { prisma } from '@/lib/prisma';

const schema = z
  .object({
    name: z.string().min(2, 'نام دوره الزامی است'),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    isActive: z.boolean().optional(),
  })
  .refine((c) => new Date(c.endDate) > new Date(c.startDate), {
    message: 'تاریخ پایان باید بعد از تاریخ شروع باشد',
    path: ['endDate'],
  });

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });
  const cycles = await prisma.cycle.findMany({ orderBy: { startDate: 'desc' } });
  return NextResponse.json(cycles);
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const exists = await prisma.cycle.findUnique({ where: { name: parsed.data.name.trim() } });
  if (exists) return NextResponse.json({ error: 'دوره‌ای با این نام قبلاً تعریف شده' }, { status: 409 });

  const cycle = await prisma.cycle.create({
    data: {
      name: parsed.data.name.trim(),
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      isActive: parsed.data.isActive ?? true,
    },
  });
  invalidateCyclesCache();
  return NextResponse.json(cycle, { status: 201 });
}
