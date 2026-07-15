import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
    include: { members: { include: { user: { select: { id: true, fullName: true } } } } },
  });
  return NextResponse.json(teams);
}
