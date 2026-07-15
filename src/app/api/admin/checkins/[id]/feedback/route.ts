import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { feedbackSchema } from '@/lib/validations';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const checkIn = await prisma.weeklyCheckIn.findUnique({ where: { id: params.id } });
  if (!checkIn) return NextResponse.json({ error: 'چک‌این یافت نشد' }, { status: 404 });

  const feedback = await prisma.checkInFeedback.upsert({
    where: { checkInId: params.id },
    create: {
      checkInId: params.id,
      score: parsed.data.score ?? null,
      comment: parsed.data.comment ?? null,
      reviewedById: session!.user.id,
    },
    update: {
      score: parsed.data.score ?? null,
      comment: parsed.data.comment ?? null,
      reviewedById: session!.user.id,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(feedback);
}
