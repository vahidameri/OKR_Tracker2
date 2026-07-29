import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as jalaali from 'jalaali-js';

const prisma = new PrismaClient();

const SEASONS = ['بهار', 'تابستان', 'پاییز', 'زمستان'];

/** دوره‌ی فصل جاری شمسی به‌عنوان دوره‌ی پیش‌فرض */
function currentCycle() {
  const now = new Date();
  const { jy, jm } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const q = Math.ceil(jm / 3);
  const sm = (q - 1) * 3 + 1;
  const em = sm + 2;
  const endDay = jalaali.jalaaliMonthLength(jy, em);
  const s = jalaali.toGregorian(jy, sm, 1);
  const e = jalaali.toGregorian(jy, em, endDay);
  return {
    name: `${SEASONS[q - 1]} ${jy}`,
    startDate: new Date(Date.UTC(s.gy, s.gm - 1, s.gd)),
    endDate: new Date(Date.UTC(e.gy, e.gm - 1, e.gd, 23, 59, 59)),
  };
}

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'OKR4052@tpd';
// اگر true (پیش‌فرض)، در هر seed پسورد همه‌ی کاربران به مقدار پیش‌فرض ریست می‌شود.
// برای حفظ پسوردهای تغییریافته، در .env مقدار SEED_RESET_PASSWORDS=false بگذارید.
const RESET_PASSWORDS = (process.env.SEED_RESET_PASSWORDS ?? 'true').toLowerCase() !== 'false';

const TEAMS: { name: string; leadName: string; description: string }[] = [
  { name: 'تکنولوژی', leadName: 'مرتضی صفری شاهی', description: 'تیم تکنولوژی' },
  { name: 'بینش داده', leadName: 'پردیس قاسمی', description: 'تیم بینش داده' },
  { name: 'عملیات/CRM', leadName: 'علی خوشنود', description: 'تیم عملیات و CRM' },
  { name: 'پیام‌رسان', leadName: 'علی نسیمی', description: 'تیم پیام‌رسان' },
  { name: 'کلاسا', leadName: 'میثاق ریگی‌نژاد', description: 'تیم کلاسا' },
  { name: 'ورزشی', leadName: 'علیرضا یحیایی', description: 'تیم ورزشی' },
  { name: 'تماشا', leadName: 'علیرضا یحیایی', description: 'تیم تماشا' },
];

// یوزرنیم‌ها بر مبنای نام لاتین (در README مستند شده و قابل تغییر است)
const USERS: { username: string; fullName: string; title?: string; role: Role; teamNames: string[] }[] = [
  // نقش‌های سازمانی بالادستی — هر دو ادمین کامل
  { username: 'vahid.ameri', fullName: 'وحید عامری', title: 'مدیر پروژه', role: 'ADMIN', teamNames: [] },
  { username: 'jalil.alizadeh', fullName: 'جلیل علیزاده', title: 'مدیر دپارتمان', role: 'ADMIN', teamNames: [] },
  // لیدهای تیم‌ها
  { username: 'morteza.safari', fullName: 'مرتضی صفری شاهی', title: 'لید تیم تکنولوژی', role: 'TEAM_MEMBER', teamNames: ['تکنولوژی'] },
  { username: 'pardis.ghasemi', fullName: 'پردیس قاسمی', title: 'لید تیم بینش داده', role: 'TEAM_MEMBER', teamNames: ['بینش داده'] },
  { username: 'ali.khoshnood', fullName: 'علی خوشنود', title: 'لید تیم عملیات/CRM', role: 'TEAM_MEMBER', teamNames: ['عملیات/CRM'] },
  { username: 'mona.nobari', fullName: 'مونا نوبری', title: 'عضو تیم عملیات', role: 'TEAM_MEMBER', teamNames: ['عملیات/CRM'] },
  { username: 'zahra.nateghi', fullName: 'زهرا ناطقی', title: 'عضو تیم عملیات', role: 'TEAM_MEMBER', teamNames: ['عملیات/CRM'] },
  { username: 'ali.nasimi', fullName: 'علی نسیمی', title: 'لید تیم پیام‌رسان', role: 'TEAM_MEMBER', teamNames: ['پیام‌رسان'] },
  { username: 'misagh.riginejad', fullName: 'میثاق ریگی‌نژاد', title: 'لید تیم کلاسا', role: 'TEAM_MEMBER', teamNames: ['کلاسا'] },
  // علیرضا یحیایی مسئول هم‌زمان ورزشی و تماشا → دو رکورد UserTeam
  { username: 'alireza.yahyaei', fullName: 'علیرضا یحیایی', title: 'لید تیم ورزشی و تماشا', role: 'TEAM_MEMBER', teamNames: ['ورزشی', 'تماشا'] },
];

async function main() {
  const passwordHash = await hash(DEFAULT_PASSWORD, 10);

  const teamByName = new Map<string, string>();
  for (const team of TEAMS) {
    const created = await prisma.team.upsert({
      where: { name: team.name },
      create: team,
      update: { leadName: team.leadName, description: team.description },
    });
    teamByName.set(team.name, created.id);
  }

  for (const user of USERS) {
    const created = await prisma.user.upsert({
      where: { username: user.username },
      create: {
        username: user.username,
        fullName: user.fullName,
        title: user.title ?? null,
        role: user.role,
        passwordHash,
        mustChangePassword: true,
      },
      // با SEED_RESET_PASSWORDS=true (پیش‌فرض) پسورد همه به مقدار پیش‌فرض ریست می‌شود
      update: {
        fullName: user.fullName,
        title: user.title ?? null,
        role: user.role,
        ...(RESET_PASSWORDS ? { passwordHash } : {}),
      },
    });

    for (const teamName of user.teamNames) {
      const teamId = teamByName.get(teamName)!;
      await prisma.userTeam.upsert({
        where: { userId_teamId: { userId: created.id, teamId } },
        create: { userId: created.id, teamId },
        update: {},
      });
    }
  }

  // دوره‌ی فصل جاری (فقط اگر هیچ دوره‌ای وجود نداشته باشد)
  const cycleCount = await prisma.cycle.count();
  if (cycleCount === 0) {
    const c = currentCycle();
    await prisma.cycle.create({ data: { ...c, isActive: true } });
    console.log(`  - دوره‌ی پیش‌فرض «${c.name}» ساخته شد`);
  }

  console.log('✔ Seed کامل شد:');
  console.log(`  - ${TEAMS.length} تیم`);
  console.log(`  - ${USERS.length} کاربر (پسورد اولیه همه: ${DEFAULT_PASSWORD})`);
  console.log('  - همه‌ی کاربران در اولین ورود باید پسورد را تغییر دهند.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
