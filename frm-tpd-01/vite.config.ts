import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base نسبی تا خروجی build روی هر مسیری از وب‌سرور داخلی قابل استقرار باشد
export default defineConfig({
  plugins: [react()],
  base: '/',
  // جلوگیری از خوانده‌شدن postcss.config مخزن والد (پروژهٔ Next.js)
  css: { postcss: {} },
});
