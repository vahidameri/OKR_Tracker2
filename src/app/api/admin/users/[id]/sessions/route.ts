import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const sessions = await prisma.userSession.findMany({
    where: { userId: params.id },
    orderBy: { loginAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(sessions);
}
