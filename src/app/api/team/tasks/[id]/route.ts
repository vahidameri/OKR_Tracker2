import { NextResponse } from 'next/server';
import { z } from 'zod';
import { canAccessTeam, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  isDone: z.boolean().optional(),
  title: z.string().min(1).max(300).optional(),
});

async function loadAndAuthorize(id: string, userId: string, role: string) {
  const task = await prisma.krTask.findUnique({
    where: { id },
    include: { teamKeyResult: { select: { teamId: true } } },
  });
  if (!task) return { task: null, allowed: false };
  const allowed = await canAccessTeam(userId, role, task.teamKeyResult.teamId);
  return { task, allowed };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 });

  const { task, allowed } = await loadAndAuthorize(params.id, session!.user.id, session!.user.role);
  if (!task) return NextResponse.json({ error: 'تسک یافت نشد' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'شما عضو این تیم نیستید' }, { status: 403 });

  const updated = await prisma.krTask.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title.trim() } : {}),
      ...(parsed.data.isDone !== undefined ? { isDone: parsed.data.isDone } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });

  const { task, allowed } = await loadAndAuthorize(params.id, session!.user.id, session!.user.role);
  if (!task) return NextResponse.json({ error: 'تسک یافت نشد' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'شما عضو این تیم نیستید' }, { status: 403 });

  await prisma.krTask.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
