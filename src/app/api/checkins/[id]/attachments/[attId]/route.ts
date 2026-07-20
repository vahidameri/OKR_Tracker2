import { NextResponse } from 'next/server';
import { canAccessTeam, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/** دانلود یک ضمیمه‌ی چک‌این (با کنترل دسترسی تیمی) */
export async function GET(_req: Request, { params }: { params: { id: string; attId: string } }) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });

  const att = await prisma.checkInAttachment.findUnique({
    where: { id: params.attId },
    include: { checkIn: { include: { teamKeyResult: { select: { teamId: true } } } } },
  });
  if (!att || att.checkInId !== params.id) {
    return NextResponse.json({ error: 'ضمیمه یافت نشد' }, { status: 404 });
  }
  const allowed = await canAccessTeam(session!.user.id, session!.user.role, att.checkIn.teamKeyResult.teamId);
  if (!allowed) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  return new NextResponse(new Uint8Array(att.data), {
    headers: {
      'Content-Type': att.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(att.filename)}`,
      'Content-Length': String(att.size),
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string; attId: string } }) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });

  const att = await prisma.checkInAttachment.findUnique({
    where: { id: params.attId },
    include: { checkIn: { include: { teamKeyResult: { select: { teamId: true } } } } },
  });
  if (!att || att.checkInId !== params.id) {
    return NextResponse.json({ error: 'ضمیمه یافت نشد' }, { status: 404 });
  }
  const allowed = await canAccessTeam(session!.user.id, session!.user.role, att.checkIn.teamKeyResult.teamId);
  if (!allowed) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  await prisma.checkInAttachment.delete({ where: { id: params.attId } });
  return NextResponse.json({ ok: true });
}
