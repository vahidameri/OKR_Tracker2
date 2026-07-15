export async function register() {
  // فقط در ران‌تایم Node (نه edge) — این شرط باعث حذف ایمپورت از باندل edge می‌شود
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startReminderScheduler } = await import('@/lib/reminder-scheduler');
    startReminderScheduler();
  }
}
