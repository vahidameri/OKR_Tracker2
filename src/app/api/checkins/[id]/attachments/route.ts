import { NextResponse } from 'next/server';
import { canAccessTeam, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const MAX_SIZE = 10 * 1024 * 1024; // ۱۰ مگابایت
const MAX_FILES = 3;
const ALLOWED = ['image/png', 'image/jpeg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

async function authorize(checkInId: string, userId: string, role: string) {
  const checkIn = await prisma.weeklyCheckIn.findUnique({
    where: { id: checkInId },
    include: { teamKeyResult: { select: { teamId: true } } },
  });
  if (!checkIn) return { ok: false as const, status: 404, error: 'چک‌این یافت نشد' };
  const allowed = await canAccessTeam(userId, role, checkIn.teamKeyResult.teamId);
  if (!allowed) return { ok: false as const, status: 403, error: 'دسترسی ندارید' };
  return { ok: true as const };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
  const auth = await authorize(params.id, session!.user.id, session!.user.role);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const files = await prisma.checkInAttachment.findMany({
    where: { checkInId: params.id },
    select: { id: true, filename: true, mimeType: true, size: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(files);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
  const auth = await authorize(params.id, session!.user.id, session!.user.role);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const existing = await prisma.checkInAttachment.count({ where: { checkInId: params.id } });
  const form = await req.formData().catch(() => null);
  const files = form?.getAll('files').filter((f): f is File => f instanceof File) ?? [];
  if (files.length === 0) return NextResponse.json({ error: 'فایلی ارسال نشد' }, { status: 400 });
  if (existing + files.length > MAX_FILES) {
    return NextResponse.json({ error: `حداکثر ${MAX_FILES} فایل مجاز است` }, { status: 400 });
  }

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `«${file.name}» بزرگ‌تر از ۱۰ مگابایت است` }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      // نوع خالی یا غیرمجاز رد می‌شود (جلوگیری از دور زدن با content-type جعلی/خالی)
      return NextResponse.json({ error: `نوع فایل «${file.name}» مجاز نیست (PNG, JPG, PDF, DOCX)` }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    await prisma.checkInAttachment.create({
      data: {
        checkInId: params.id,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        data: buffer,
        uploadedById: session!.user.id,
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
