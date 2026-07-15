import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { progressStatusEnum } from '@/lib/validations';

const editSchema = z.object({
  currentValue: z.coerce.number().nullable().optional(),
  booleanValue: z.boolean().nullable().optional(),
  textValue: z.string().nullable().optional(),
  progressStatus: progressStatusEnum.optional(),
  blockerDescription: z.string().nullable().optional(),
});

/**
 * ویرایش ادمینی چک‌این (از جمله هفته‌های گذشته که برای تیم قفل‌اند).
 * هر ویرایش با isEdited/editedBy علامت می‌خورد تا دستکاری داده‌ی تاریخی شفاف بماند.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const checkIn = await prisma.weeklyCheckIn.findUnique({ where: { id: params.id } });
  if (!checkIn) return NextResponse.json({ error: 'چک‌این یافت نشد' }, { status: 404 });

  const updated = await prisma.weeklyCheckIn.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      blockerDescription: parsed.data.blockerDescription?.trim() || null,
      isEdited: true,
      editedById: session!.user.id,
      editedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
