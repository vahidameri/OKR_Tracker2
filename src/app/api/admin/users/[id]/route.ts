import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUserSchema } from '@/lib/validations';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

  if (parsed.data.isActive === false && user.id === session!.user.id) {
    return NextResponse.json({ error: 'نمی‌توانید حساب خودتان را غیرفعال کنید' }, { status: 400 });
  }

  const { teamIds, password, ...rest } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await hash(password, 10), mustChangePassword: true } : {}),
      },
    });
    if (teamIds) {
      await tx.userTeam.deleteMany({ where: { userId: params.id } });
      await tx.userTeam.createMany({ data: teamIds.map((teamId) => ({ userId: params.id, teamId })) });
    }
  });

  return NextResponse.json({ ok: true });
}
