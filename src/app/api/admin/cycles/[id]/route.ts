import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { invalidateCyclesCache } from '@/lib/cycles';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 });

  await prisma.cycle.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.startDate ? { startDate: new Date(parsed.data.startDate) } : {}),
      ...(parsed.data.endDate ? { endDate: new Date(parsed.data.endDate) } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
  });
  invalidateCyclesCache();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });
  await prisma.cycle.delete({ where: { id: params.id } });
  invalidateCyclesCache();
  return NextResponse.json({ ok: true });
}
