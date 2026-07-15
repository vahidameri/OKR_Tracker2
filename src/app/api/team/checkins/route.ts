import { NextResponse } from 'next/server';
import { canAccessTeam, requireUser } from '@/lib/auth';
import { getWeekStart } from '@/lib/jalali';
import { prisma } from '@/lib/prisma';
import { checkInSchema } from '@/lib/validations';

/** ثبت/به‌روزرسانی چک‌این هفته‌ی جاری برای سهم تیم از یک KR */
export async function POST(req: Request) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const tkr = await prisma.teamKeyResult.findUnique({
    where: { id: parsed.data.teamKeyResultId },
    include: { keyResult: { select: { metricType: true } } },
  });
  if (!tkr) return NextResponse.json({ error: 'نتیجه کلیدی تیم یافت نشد' }, { status: 404 });

  // فقط اعضای همان تیم (یا ادمین) اجازه ثبت دارند
  const allowed = await canAccessTeam(session!.user.id, session!.user.role, tkr.teamId);
  if (!allowed) return NextResponse.json({ error: 'شما عضو این تیم نیستید' }, { status: 403 });

  // اعتبارسنجی مقدار متناسب با نوع سنجش
  const { metricType } = tkr.keyResult;
  if (metricType === 'NUMERIC' && (parsed.data.currentValue === null || parsed.data.currentValue === undefined)) {
    return NextResponse.json({ error: 'برای KR عددی، مقدار فعلی الزامی است' }, { status: 400 });
  }
  if (metricType === 'BOOLEAN' && (parsed.data.booleanValue === null || parsed.data.booleanValue === undefined)) {
    return NextResponse.json({ error: 'برای KR بله/خیر، انتخاب بله یا خیر الزامی است' }, { status: 400 });
  }
  if (metricType === 'TEXT' && !parsed.data.textValue?.trim()) {
    return NextResponse.json({ error: 'برای KR محتوایی، متن گزارش الزامی است' }, { status: 400 });
  }

  const weekStartDate = getWeekStart();
  const data = {
    currentValue: metricType === 'NUMERIC' ? parsed.data.currentValue : null,
    booleanValue: metricType === 'BOOLEAN' ? parsed.data.booleanValue : null,
    textValue: metricType === 'TEXT' ? (parsed.data.textValue ?? null) : null,
    progressStatus: parsed.data.progressStatus,
    blockerDescription: parsed.data.blockerDescription?.trim() || null,
    submittedById: session!.user.id,
    submittedAt: new Date(),
  };

  const checkIn = await prisma.weeklyCheckIn.upsert({
    where: {
      teamKeyResultId_weekStartDate: {
        teamKeyResultId: tkr.id,
        weekStartDate,
      },
    },
    create: { teamKeyResultId: tkr.id, weekStartDate, ...data },
    update: data,
  });

  return NextResponse.json(checkIn, { status: 201 });
}
