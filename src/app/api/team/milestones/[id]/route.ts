import { NextResponse } from 'next/server';
import { z } from 'zod';
import { canAccessTeam, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  isDone: z.boolean().optional(),
  title: z.string().min(1).max(300).optional(),
});

async function loadAndAuthorize(id: string, userId: string, role: string) {
  const milestone = await prisma.milestone.findUnique({
    where: { id },
    include: { teamKeyResult: { select: { id: true, teamId: true } } },
  });
  if (!milestone) return { milestone: null, allowed: false };
  const allowed = await canAccessTeam(userId, role, milestone.teamKeyResult.teamId);
  return { milestone, allowed };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 });

  const { milestone, allowed } = await loadAndAuthorize(params.id, session!.user.id, session!.user.role);
  if (!milestone) return NextResponse.json({ error: 'مایل‌استون یافت نشد' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'شما عضو این تیم نیستید' }, { status: 403 });

  const updated = await prisma.milestone.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title.trim() } : {}),
      ...(parsed.data.isDone !== undefined
        ? { isDone: parsed.data.isDone, doneAt: parsed.data.isDone ? new Date() : null }
        : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });

  const { milestone, allowed } = await loadAndAuthorize(params.id, session!.user.id, session!.user.role);
  if (!milestone) return NextResponse.json({ error: 'مایل‌استون یافت نشد' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'شما عضو این تیم نیستید' }, { status: 403 });

  await prisma.milestone.delete({ where: { id: params.id } });

  // همگام‌سازی تارگت با تعداد جدید
  const count = await prisma.milestone.count({ where: { teamKeyResultId: milestone.teamKeyResult.id } });
  await prisma.teamKeyResult.update({
    where: { id: milestone.teamKeyResult.id },
    data: { targetValueOverride: count > 0 ? count : null, minValueOverride: count > 0 ? 0 : null },
  });

  return NextResponse.json({ ok: true });
}
