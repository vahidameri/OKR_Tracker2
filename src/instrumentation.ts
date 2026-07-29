export async function register() {
  // فقط در ران‌تایم Node (نه edge) — این شرط باعث حذف ایمپورت از باندل edge می‌شود
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // هشدار امنیتی: در محیط production باید NEXTAUTH_SECRET قوی و غیرپیش‌فرض باشد
    const secret = process.env.NEXTAUTH_SECRET;
    const weak = !secret || secret.length < 16 || secret === 'change-me-to-a-strong-random-secret';
    if (process.env.NODE_ENV === 'production' && weak) {
      console.warn(
        '[امنیت] NEXTAUTH_SECRET تنظیم نشده یا ضعیف است. برای استقرار روی سرور، یک مقدار تصادفی قوی بگذارید: openssl rand -base64 32'
      );
    }

    const { startReminderScheduler } = await import('@/lib/reminder-scheduler');
    startReminderScheduler();
  }
}
