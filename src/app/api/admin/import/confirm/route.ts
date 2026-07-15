import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { metricTypeEnum } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

const confirmRowSchema = z.object({
  objectiveTitle: z.string().min(1),
  objectiveDescription: z.string().nullable(),
  objectiveWeight: z.number().positive(),
  period: z.string().min(1),
  krTitle: z.string().min(1),
  krWeight: z.number().positive(),
  metricType: metricTypeEnum,
  minValue: z.number().nullable(),
  targetValue: z.number().nullable(),
  unit: z.string().nullable(),
  description: z.string().nullable(),
  teams: z
    .array(
      z.object({
        teamId: z.string().min(1),
        weight: z.number().positive(),
        targetValueOverride: z.number().nullable(),
      })
    )
    .min(1),
});

const confirmSchema = z.object({ rows: z.array(confirmRowSchema).min(1) });

/** ثبت نهایی ردیف‌های معتبر پیش‌نمایش: ردیف‌های هم‌عنوان زیر یک هدف گروه می‌شوند */
export async function POST(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'داده‌های تأیید نامعتبر است؛ فایل را دوباره آپلود کنید' }, { status: 400 });
  }

  let objectivesCreated = 0;
  let krsCreated = 0;
  const auditEntries: import('@/lib/audit').AuditEntry[] = [];

  await prisma.$transaction(async (tx) => {
    const objectiveCache = new Map<string, string>();

    for (const row of parsed.data.rows) {
      const key = `${row.objectiveTitle}::${row.period}`;
      let objectiveId = objectiveCache.get(key);

      if (!objectiveId) {
        const existing = await tx.objective.findFirst({
          where: { title: row.objectiveTitle, period: row.period },
        });
        if (existing) {
          objectiveId = existing.id;
        } else {
          const created = await tx.objective.create({
            data: {
              title: row.objectiveTitle,
              description: row.objectiveDescription,
              weight: row.objectiveWeight,
              period: row.period,
              createdById: session!.user.id,
            },
          });
          objectiveId = created.id;
          objectivesCreated += 1;
          auditEntries.push({
            entityType: 'OBJECTIVE',
            entityId: created.id,
            entityLabel: created.title,
            field: 'ایجاد هدف (آپلود اکسل)',
            newValue: `دوره ${created.period}`,
          });
        }
        objectiveCache.set(key, objectiveId);
      }

      const createdKr = await tx.keyResult.create({
        data: {
          objectiveId,
          title: row.krTitle,
          weight: row.krWeight,
          metricType: row.metricType,
          minValue: row.minValue,
          targetValue: row.targetValue,
          unit: row.unit,
          description: row.description,
          isShared: row.teams.length > 1,
          teams: {
            create: row.teams.map((t) => ({
              teamId: t.teamId,
              weight: t.weight,
              targetValueOverride: t.targetValueOverride,
            })),
          },
        },
      });
      krsCreated += 1;
      auditEntries.push({
        entityType: 'KEY_RESULT',
        entityId: createdKr.id,
        entityLabel: createdKr.title,
        field: 'ایجاد نتیجه کلیدی (آپلود اکسل)',
        newValue: `${row.teams.length} تیم`,
      });
    }
  });

  const { logAudit } = await import('@/lib/audit');
  await logAudit(prisma, session!.user.id, auditEntries);

  return NextResponse.json({ objectivesCreated, krsCreated });
}
