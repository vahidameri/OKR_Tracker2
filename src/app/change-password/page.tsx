import { redirect } from 'next/navigation';

/** تغییر پسورد به «تنظیمات کاربری» منتقل شده و دیگر اجباری نیست */
export default function ChangePasswordRedirect() {
  redirect('/settings');
}
