/**
 * نقش‌ها: ادمین (مدیریت) و عضو تیم.
 * (مقدار قدیمی SUPER_ADMIN هم به‌عنوان ادمین در نظر گرفته می‌شود تا در صورت وجود
 * دادهٔ قدیمی، دسترسی از دست نرود؛ اما دیگر نقش جداگانه‌ای نیست.)
 */
export function isAdminRole(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'ادمین',
  ADMIN: 'ادمین',
  TEAM_MEMBER: 'عضو تیم',
};

export function roleLabel(role?: string | null): string {
  return (role && ROLE_LABELS[role]) || 'عضو تیم';
}
