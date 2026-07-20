import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** دوره‌های فعال برای انتخابگر (در دسترس همه‌ی کاربران واردشده) */
export async function GET() {
  const { error } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
  const cycles = await prisma.cycle.findMany({
    where: { isActive: true },
    orderBy: { startDate: 'desc' },
    select: { id: true, name: true, startDate: true, endDate: true },
  });
  return NextResponse.json(cycles);
}
