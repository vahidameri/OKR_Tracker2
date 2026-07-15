import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'سامانه رهگیری OKR — دپارتمان محصول و تکنولوژی',
  description: 'ثبت، تعریف و رهگیری هفتگی OKRهای تیم‌های دپارتمان محصول و تکنولوژی',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
