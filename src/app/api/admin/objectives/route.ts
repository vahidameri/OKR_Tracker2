import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { objectiveSchema } from '@/lib/validations';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const objectives = await prisma.objective.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      keyResults: {
        include: { teams: { include: { team: { select: { id: true, name: true } } } } },
      },
    },
  });
  return NextResponse.json(objectives);
}

export async function POST(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = objectiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const { keyResults, ...obj } = parsed.data;

  const created = await prisma.objective.create({
    data: {
      ...obj,
      createdById: session!.user.id,
      keyResults: {
        create: keyResults.map((kr) => ({
          title: kr.title,
          weight: kr.weight,
          metricType: kr.metricType,
          minValue: kr.minValue ?? null,
          targetValue: kr.targetValue ?? null,
          unit: kr.unit ?? null,
          description: kr.description ?? null,
          isShared: kr.teams.length > 1,
          teams: {
            create: kr.teams.map((t) => ({
              teamId: t.teamId,
              weight: t.weight,
              targetValueOverride: t.targetValueOverride ?? null,
              minValueOverride: t.minValueOverride ?? null,
            })),
          },
        })),
      },
    },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
