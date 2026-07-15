import { NextResponse } from 'next/server';
import { canAccessTeam, requireUser } from '@/lib/auth';
import { getTeamOkrs } from '@/lib/okr-data';

export async function GET(req: Request) {
  const { error, session } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const teamId = new URL(req.url).searchParams.get('teamId');
  if (!teamId) return NextResponse.json({ error: 'teamId الزامی است' }, { status: 400 });

  const allowed = await canAccessTeam(session!.user.id, session!.user.role, teamId);
  if (!allowed) return NextResponse.json({ error: 'شما عضو این تیم نیستید' }, { status: 403 });

  const okrs = await getTeamOkrs(teamId);
  return NextResponse.json(okrs);
}
