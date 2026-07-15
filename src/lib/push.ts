import webpush from 'web-push';
import { getWeekStart } from '@/lib/jalali';
import { prisma } from '@/lib/prisma';

/**
 * کلیدهای VAPID در دیتابیس (AppSetting) نگه‌داری می‌شوند و بار اول خودکار تولید می‌شوند؛
 * بنابراین نیازی به تنظیم دستی متغیر محیطی نیست و اشتراک‌ها بعد از ری‌استارت معتبر می‌مانند.
 */
async function getVapidKeys() {
  const [pub, priv] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'vapid_public' } }),
    prisma.appSetting.findUnique({ where: { key: 'vapid_private' } }),
  ]);
  if (pub && priv) return { publicKey: pub.value, privateKey: priv.value };

  const keys = webpush.generateVAPIDKeys();
  const created = await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: 'vapid_public' },
      create: { key: 'vapid_public', value: keys.publicKey },
      update: {},
    }),
    prisma.appSetting.upsert({
      where: { key: 'vapid_private' },
      create: { key: 'vapid_private', value: keys.privateKey },
      update: {},
    }),
  ]);
  return { publicKey: created[0].value, privateKey: created[1].value };
}

export async function getPublicVapidKey(): Promise<string> {
  return (await getVapidKeys()).publicKey;
}

async function configured() {
  const { publicKey, privateKey } = await getVapidKeys();
  webpush.setVapidDetails('mailto:okr-admin@internal.local', publicKey, privateKey);
  return webpush;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0) return { sent: 0 };
  const wp = await configured();
  const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
        sent += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // اشتراک منقضی/حذف‌شده را پاک کن
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
        }
      }
    })
  );
  return { sent };
}

/** یادآوری چک‌این به اعضای تیم‌هایی که این هفته هنوز KR ثبت‌نشده دارند */
export async function sendCheckinReminders() {
  const weekStart = getWeekStart();
  const pending = await prisma.teamKeyResult.findMany({
    where: { checkIns: { none: { weekStartDate: weekStart } } },
    select: { teamId: true },
  });
  if (pending.length === 0) return { sent: 0, pendingTeams: 0 };

  const teamIds = Array.from(new Set(pending.map((p) => p.teamId)));
  const members = await prisma.userTeam.findMany({
    where: { teamId: { in: teamIds }, user: { isActive: true } },
    select: { userId: true },
  });
  const userIds = Array.from(new Set(members.map((m) => m.userId)));

  const { sent } = await sendPushToUsers(userIds, {
    title: 'یادآوری چک‌این هفتگی OKR',
    body: 'مهلت ثبت وضعیت این هفته تا پایان چهارشنبه است. لطفاً چک‌این تیم‌تان را ثبت کنید.',
    url: '/team/checkin',
  });
  return { sent, pendingTeams: teamIds.length };
}
