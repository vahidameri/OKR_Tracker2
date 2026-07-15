import { NextResponse } from 'next/server';
import { z } from 'zod';
import { diffFields, logAudit } from '@/lib/audit';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  weight: z.coerce.number().positive().optional(),
  period: z.string().min(1).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const before = await prisma.objective.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: 'هدف یافت نشد' }, { status: 404 });

  await prisma.objective.update({ where: { id: params.id }, data: parsed.data });

  await logAudit(
    prisma,
    session!.user.id,
    diffFields(
      { entityType: 'OBJECTIVE', entityId: before.id, entityLabel: before.title },
      before as unknown as Record<string, unknown>,
      parsed.data,
      [
        { key: 'title', label: 'عنوان' },
        { key: 'description', label: 'توضیحات' },
        { key: 'weight', label: 'وزن' },
        { key: 'period', label: 'دوره' },
      ]
    )
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const before = await prisma.objective.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: 'هدف یافت نشد' }, { status: 404 });

  await prisma.objective.delete({ where: { id: params.id } });
  await logAudit(prisma, session!.user.id, [
    { entityType: 'OBJECTIVE', entityId: before.id, entityLabel: before.title, field: 'حذف هدف' },
  ]);
  return NextResponse.json({ ok: true });
}
