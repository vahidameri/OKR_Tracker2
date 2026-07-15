import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { loadAutoThresholds, saveAutoThresholds } from '@/lib/settings';

const schema = z
  .object({
    ahead: z.coerce.number().min(0).max(100),
    atRisk: z.coerce.number().min(0).max(100),
    behind: z.coerce.number().min(0).max(100),
  })
  .refine((t) => t.behind > t.atRisk, {
    message: 'آستانه‌ی «عقب‌افتاده» باید بزرگ‌تر از آستانه‌ی «در ریسک» باشد',
  });

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });
  return NextResponse.json(await loadAutoThresholds());
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 });
  }

  await saveAutoThresholds(parsed.data);
  return NextResponse.json({ ok: true });
}
