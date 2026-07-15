import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { keyResultSchema } from '@/lib/validations';

const createSchema = z.object({ objectiveId: z.string().min(1) }).and(keyResultSchema);

export async function POST(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const { objectiveId, teams, ...kr } = parsed.data;
  const objective = await prisma.objective.findUnique({ where: { id: objectiveId } });
  if (!objective) return NextResponse.json({ error: 'هدف یافت نشد' }, { status: 404 });

  const created = await prisma.keyResult.create({
    data: {
      objectiveId,
      title: kr.title,
      weight: kr.weight,
      metricType: kr.metricType,
      minValue: kr.minValue ?? null,
      targetValue: kr.targetValue ?? null,
      unit: kr.unit ?? null,
      description: kr.description ?? null,
      isShared: teams.length > 1,
      teams: {
        create: teams.map((t) => ({
          teamId: t.teamId,
          weight: t.weight,
          targetValueOverride: t.targetValueOverride ?? null,
          minValueOverride: t.minValueOverride ?? null,
        })),
      },
    },
  });

  const { logAudit } = await import('@/lib/audit');
  await logAudit(prisma, session!.user.id, [
    {
      entityType: 'KEY_RESULT',
      entityId: created.id,
      entityLabel: created.title,
      field: 'ایجاد نتیجه کلیدی',
      newValue: `${teams.length} تیم · وزن ${created.weight}${created.targetValue !== null ? ` · تارگت ${created.targetValue}` : ''}`,
    },
  ]);

  return NextResponse.json({ id: created.id }, { status: 201 });
}
