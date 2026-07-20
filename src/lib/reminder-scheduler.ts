import { prisma } from '@/lib/prisma';
import { sendCheckinReminders } from '@/lib/push';

const REMINDER_HOUR = 10; // ساعت ارسال به وقت تهران
const REMINDER_DAYS = new Set(['Sat', 'Sun']); // شنبه تا یک‌شنبه (بازه‌ی ثبت چک‌این)

function tehranNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { weekday: get('weekday'), hour: Number(get('hour')), dateKey: `${get('year')}-${get('month')}-${get('day')}` };
}

let started = false;

/**
 * زمان‌بند داخلی (بدون سرویس خارجی): هر ۱۰ دقیقه چک می‌کند و روزهای دوشنبه تا
 * چهارشنبه، از ساعت ۱۰ صبح تهران به بعد، یک بار در روز یادآوری پوش می‌فرستد.
 */
export function startReminderScheduler() {
  if (started) return;
  started = true;

  const tick = async () => {
    // اسنپ‌شات لیدربورد با تغییر ماه شمسی (مستقل از یادآوری پوش)
    try {
      const { snapshotLeaderboardIfMonthChanged } = await import('@/lib/leaderboard');
      await snapshotLeaderboardIfMonthChanged();
    } catch (err) {
      console.error('[leaderboard] خطا در اسنپ‌شات ماهانه:', err);
    }

    try {
      const { weekday, hour, dateKey } = tehranNow();
      if (!REMINDER_DAYS.has(weekday) || hour < REMINDER_HOUR) return;

      const last = await prisma.appSetting.findUnique({ where: { key: 'reminder_last_sent' } });
      if (last?.value === dateKey) return;

      await prisma.appSetting.upsert({
        where: { key: 'reminder_last_sent' },
        create: { key: 'reminder_last_sent', value: dateKey },
        update: { value: dateKey },
      });

      const result = await sendCheckinReminders();
      console.log(`[reminder] ${dateKey}: ${result.sent} پوش برای ${result.pendingTeams ?? 0} تیم ارسال شد`);
    } catch (err) {
      console.error('[reminder] خطا در ارسال یادآوری:', err);
    }
  };

  setInterval(tick, 10 * 60 * 1000);
  setTimeout(tick, 15_000); // اجرای اولیه کمی بعد از بالا آمدن سرور
}
