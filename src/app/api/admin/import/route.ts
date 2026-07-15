import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { currentJalaliQuarter } from '@/lib/jalali';
import { parseImportWorkbook } from '@/lib/excel-import';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/** پارس فایل اکسل و برگرداندن پیش‌نمایش + خطاهای هر ردیف (بدون ذخیره) */
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'فایل اکسل ارسال نشده است' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const teams = await prisma.team.findMany({ select: { id: true, name: true } });

  let rows;
  try {
    rows = parseImportWorkbook(buffer, teams, currentJalaliQuarter());
  } catch {
    return NextResponse.json({ error: 'فایل قابل خواندن نیست؛ فرمت xlsx معتبر آپلود کنید' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'هیچ ردیفی در فایل پیدا نشد' }, { status: 400 });
  }

  return NextResponse.json({
    rows,
    validCount: rows.filter((r) => r.errors.length === 0).length,
    invalidCount: rows.filter((r) => r.errors.length > 0).length,
  });
}
