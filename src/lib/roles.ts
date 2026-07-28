/**
 * نقش‌ها: سوپرادمین (دسترسی کامل، بالاترین سطح)، ادمین (مدیریت)، عضو تیم.
 * سوپرادمین همه‌ی اختیارات ادمین را دارد؛ برای همین در همه‌ی گیت‌های دسترسی
 * از isAdminRole استفاده می‌کنیم تا هر دو نقش مدیریتی مجاز باشند.
 */
export function isAdminRole(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'SUPER_ADMIN';
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'سوپر ادمین',
  ADMIN: 'ادمین',
  TEAM_MEMBER: 'عضو تیم',
};

export function roleLabel(role?: string | null): string {
  return (role && ROLE_LABELS[role]) || 'عضو تیم';
}
