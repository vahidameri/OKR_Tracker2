import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Okr@1404';

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
const USERS: { username: string; fullName: string; role: Role; teamNames: string[] }[] = [
  // نقش‌های سازمانی بالادستی — هر دو ADMIN کامل
  { username: 'vahid.ameri', fullName: 'وحید عامری', role: 'ADMIN', teamNames: [] },
  { username: 'jalil.alizadeh', fullName: 'جلیل علیزاده', role: 'ADMIN', teamNames: [] },
  // لیدهای تیم‌ها
  { username: 'morteza.safari', fullName: 'مرتضی صفری شاهی', role: 'TEAM_MEMBER', teamNames: ['تکنولوژی'] },
  { username: 'pardis.ghasemi', fullName: 'پردیس قاسمی', role: 'TEAM_MEMBER', teamNames: ['بینش داده'] },
  { username: 'ali.khoshnood', fullName: 'علی خوشنود', role: 'TEAM_MEMBER', teamNames: ['عملیات/CRM'] },
  { username: 'ali.nasimi', fullName: 'علی نسیمی', role: 'TEAM_MEMBER', teamNames: ['پیام‌رسان'] },
  { username: 'misagh.riginejad', fullName: 'میثاق ریگی‌نژاد', role: 'TEAM_MEMBER', teamNames: ['کلاسا'] },
  // علیرضا یحیایی مسئول هم‌زمان ورزشی و تماشا → دو رکورد UserTeam
  { username: 'alireza.yahyaei', fullName: 'علیرضا یحیایی', role: 'TEAM_MEMBER', teamNames: ['ورزشی', 'تماشا'] },
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
        role: user.role,
        passwordHash,
        mustChangePassword: true,
      },
      update: { fullName: user.fullName, role: user.role },
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
