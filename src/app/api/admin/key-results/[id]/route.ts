import { NextResponse } from 'next/server';
import { diffFields, logAudit, type AuditEntry } from '@/lib/audit';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { keyResultSchema } from '@/lib/validations';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = keyResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const existing = await prisma.keyResult.findUnique({
    where: { id: params.id },
    include: { teams: { include: { team: { select: { name: true } } } } },
  });
  if (!existing) return NextResponse.json({ error: 'نتیجه کلیدی یافت نشد' }, { status: 404 });

  const teamNames = new Map<string, string>(
    (await prisma.team.findMany({ select: { id: true, name: true } })).map((t) => [t.id, t.name])
  );

  const { teams, ...kr } = parsed.data;
  const keepTeamIds = new Set(teams.map((t) => t.teamId));

  // ساخت رکوردهای تاریخچه قبل از اعمال تغییرات
  const auditEntries: AuditEntry[] = diffFields(
    { entityType: 'KEY_RESULT', entityId: existing.id, entityLabel: existing.title },
    existing as unknown as Record<string, unknown>,
    kr,
    [
      { key: 'title', label: 'عنوان' },
      { key: 'weight', label: 'وزن پیش‌فرض' },
      { key: 'metricType', label: 'نوع سنجش' },
      { key: 'minValue', label: 'حداقل' },
      { key: 'targetValue', label: 'تارگت' },
      { key: 'unit', label: 'واحد' },
      { key: 'description', label: 'توضیحات' },
    ]
  );
  for (const old of existing.teams) {
    const next = teams.find((t) => t.teamId === old.teamId);
    if (!next) {
      auditEntries.push({
        entityType: 'TEAM_KEY_RESULT',
        entityId: old.id,
        entityLabel: `${existing.title} — ${old.team.name}`,
        field: 'حذف تخصیص تیم',
        oldValue: `وزن ${old.weight}`,
      });
      continue;
    }
    const pairs: [string, unknown, unknown][] = [
      ['وزن تیمی', old.weight, next.weight],
      ['تارگت تیمی', old.targetValueOverride, next.targetValueOverride ?? null],
      ['حداقل تیمی', old.minValueOverride, next.minValueOverride ?? null],
    ];
    for (const [label, o, n] of pairs) {
      if (String(o ?? '') !== String(n ?? '')) {
        auditEntries.push({
          entityType: 'TEAM_KEY_RESULT',
          entityId: old.id,
          entityLabel: `${existing.title} — ${old.team.name}`,
          field: label,
          oldValue: o,
          newValue: n,
        });
      }
    }
  }
  for (const next of teams) {
    if (!existing.teams.some((t) => t.teamId === next.teamId)) {
      auditEntries.push({
        entityType: 'TEAM_KEY_RESULT',
        entityId: next.teamId,
        entityLabel: `${existing.title} — ${teamNames.get(next.teamId) ?? next.teamId}`,
        field: 'افزودن تخصیص تیم',
        newValue: `وزن ${next.weight}${next.targetValueOverride != null ? ` · تارگت ${next.targetValueOverride}` : ''}`,
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.keyResult.update({
      where: { id: params.id },
      data: {
        title: kr.title,
        weight: kr.weight,
        metricType: kr.metricType,
        minValue: kr.minValue ?? null,
        targetValue: kr.targetValue ?? null,
        targetBoolean: kr.targetBoolean ?? true,
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

  await logAudit(prisma, session!.user.id, auditEntries);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const before = await prisma.keyResult.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: 'نتیجه کلیدی یافت نشد' }, { status: 404 });

  await prisma.keyResult.delete({ where: { id: params.id } });
  await logAudit(prisma, session!.user.id, [
    { entityType: 'KEY_RESULT', entityId: before.id, entityLabel: before.title, field: 'حذف نتیجه کلیدی' },
  ]);
  return NextResponse.json({ ok: true });
}
