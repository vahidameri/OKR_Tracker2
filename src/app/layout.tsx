import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'سامانه رهگیری OKR — دپارتمان محصول و تکنولوژی',
  description: 'ثبت، تعریف و رهگیری هفتگی OKRهای تیم‌های دپارتمان محصول و تکنولوژی',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // dir ریشه ltr است تا اسکرول‌بار مرورگر سمت راست بیفتد؛ کل محتوا با body راست‌به‌چپ می‌شود
    <html lang="fa" dir="ltr">
      <body dir="rtl">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
