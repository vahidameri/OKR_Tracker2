import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { keyResultSchema } from '@/lib/validations';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = keyResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const existing = await prisma.keyResult.findUnique({
    where: { id: params.id },
    include: { teams: true },
  });
  if (!existing) return NextResponse.json({ error: 'نتیجه کلیدی یافت نشد' }, { status: 404 });

  const { teams, ...kr } = parsed.data;
  const keepTeamIds = new Set(teams.map((t) => t.teamId));

  await prisma.$transaction(async (tx) => {
    await tx.keyResult.update({
      where: { id: params.id },
      data: {
        title: kr.title,
        weight: kr.weight,
        metricType: kr.metricType,
        minValue: kr.minValue ?? null,
        targetValue: kr.targetValue ?? null,
        unit: kr.unit ?? null,
        description: kr.description ?? null,
        isShared: teams.length > 1,
      },
    });

    // حذف تخصیص تیم‌هایی که دیگر انتخاب نشده‌اند (چک‌این‌هایشان هم cascade حذف می‌شود)
    await tx.teamKeyResult.deleteMany({
      where: { keyResultId: params.id, teamId: { notIn: Array.from(keepTeamIds) } },
    });

    for (const t of teams) {
      await tx.teamKeyResult.upsert({
        where: { teamId_keyResultId: { teamId: t.teamId, keyResultId: params.id } },
        create: {
          teamId: t.teamId,
          keyResultId: params.id,
          weight: t.weight,
          targetValueOverride: t.targetValueOverride ?? null,
          minValueOverride: t.minValueOverride ?? null,
        },
        update: {
          weight: t.weight,
          targetValueOverride: t.targetValueOverride ?? null,
          minValueOverride: t.minValueOverride ?? null,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  await prisma.keyResult.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
