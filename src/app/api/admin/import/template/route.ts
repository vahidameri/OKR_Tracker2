import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { buildTemplateWorkbook } from '@/lib/excel-import';

export const runtime = 'nodejs';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const buffer = buildTemplateWorkbook();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="okr-import-template.xlsx"',
    },
  });
}
