import { NextResponse } from 'next/server';
import { z } from 'zod';
import { canAccessTeam, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  teamKeyResultId: z.string().min(1),
  title: z.string().min(1, 'عنوان مایل‌استون الزامی است').max(300),
});

/** همگام‌سازی تارگت KR مایل‌استونی با تعداد کل مایل‌استون‌ها */
async function syncTarget(teamKeyResultId: string) {
  const count = await prisma.milestone.count({ where: { teamKeyResultId } });
  await prisma.teamKeyResult.update({
    where: { id: teamKeyResultId },
    data: { targetValueOverride: count > 0 ? count : null, minValueOverride: count > 0 ? 0 : null },
  });
}

export async function POST(req: Request) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const tkr = await prisma.teamKeyResult.findUnique({
    where: { id: parsed.data.teamKeyResultId },
    include: { keyResult: { select: { metricType: true } }, _count: { select: { milestones: true } } },
  });
  if (!tkr) return NextResponse.json({ error: 'نتیجه کلیدی تیم یافت نشد' }, { status: 404 });
  if (tkr.keyResult.metricType !== 'BOOLEAN') {
    return NextResponse.json({ error: 'مایل‌استون فقط برای KRهای بله/خیر تعریف می‌شود' }, { status: 400 });
  }

  const allowed = await canAccessTeam(session!.user.id, session!.user.role, tkr.teamId);
  if (!allowed) return NextResponse.json({ error: 'شما عضو این تیم نیستید' }, { status: 403 });

  const milestone = await prisma.milestone.create({
    data: {
      teamKeyResultId: tkr.id,
      title: parsed.data.title.trim(),
      order: tkr._count.milestones,
    },
  });
  await syncTarget(tkr.id);

  return NextResponse.json(milestone, { status: 201 });
}
