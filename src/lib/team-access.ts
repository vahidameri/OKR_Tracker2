import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/roles';

/** تیم‌های قابل‌دسترسی کاربر: ادمین همه‌ی تیم‌ها، عضو تیم فقط تیم‌های خودش */
export async function getUserTeams(userId: string, role: string) {
  if (isAdminRole(role)) {
    return prisma.team.findMany({ orderBy: { name: 'asc' } });
  }
  const memberships = await prisma.userTeam.findMany({
    where: { userId },
    include: { team: true },
    orderBy: { team: { name: 'asc' } },
  });
  return memberships.map((m) => m.team);
}

/** انتخاب تیم فعال از پارامتر URL با اعتبارسنجی عضویت */
export function resolveActiveTeam<T extends { id: string }>(teams: T[], requestedId?: string): T | null {
  if (teams.length === 0) return null;
  if (requestedId) {
    const found = teams.find((t) => t.id === requestedId);
    if (found) return found;
  }
  return teams[0];
}
