import { NextResponse } from 'next/server';
import { z } from 'zod';
import { canAccessTeam, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({ body: z.string().min(1, 'متن کامنت خالی است').max(2000) });

/** افزودن کامنت روی چک‌این — مجاز برای ادمین و اعضای تیمِ همان چک‌این */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const checkIn = await prisma.weeklyCheckIn.findUnique({
    where: { id: params.id },
    include: { teamKeyResult: { select: { teamId: true } } },
  });
  if (!checkIn) return NextResponse.json({ error: 'چک‌این یافت نشد' }, { status: 404 });

  const allowed = await canAccessTeam(session!.user.id, session!.user.role, checkIn.teamKeyResult.teamId);
  if (!allowed) return NextResponse.json({ error: 'شما به این چک‌این دسترسی ندارید' }, { status: 403 });

  const comment = await prisma.checkInComment.create({
    data: { checkInId: params.id, authorId: session!.user.id, body: parsed.data.body.trim() },
    include: { author: { select: { fullName: true, role: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
