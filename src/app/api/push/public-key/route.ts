import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getPublicVapidKey } from '@/lib/push';

export async function GET() {
  const { error } = await requireUser();
  if (error) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
  return NextResponse.json({ publicKey: await getPublicVapidKey() });
}
