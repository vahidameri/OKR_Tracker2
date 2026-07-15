import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { formatJalali, formatJalaliDateTime } from '@/lib/jalali';
import { fetchAllTkrs, tkrProgress } from '@/lib/okr-data';
import { METRIC_LABELS, STATUS_LABELS } from '@/lib/progress';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type Row = Record<string, string | number | boolean | null>;

/** داده‌های خام هر دیتاست به‌صورت ردیف‌های تخت (برای csv/md) و همان‌ها برای json */
async function buildDataset(dataset: string): Promise<{ rows: Row[]; name: string } | null> {
  if (dataset === 'checkins') {
    const checkIns = await prisma.weeklyCheckIn.findMany({
      orderBy: [{ weekStartDate: 'desc' }, { submittedAt: 'desc' }],
      include: {
        feedback: true,
        submittedBy: { select: { fullName: true } },
        teamKeyResult: {
          include: {
            team: { select: { name: true } },
            keyResult: { include: { objective: { select: { title: true, period: true } } } },
          },
        },
      },
    });
    return {
      name: 'checkins',
      rows: checkIns.map((c) => ({
        'تیم': c.teamKeyResult.team.name,
        'دوره': c.teamKeyResult.keyResult.objective.period,
        'هدف': c.teamKeyResult.keyResult.objective.title,
        'نتیجه کلیدی': c.teamKeyResult.keyResult.title,
        'نوع سنجش': METRIC_LABELS[c.teamKeyResult.keyResult.metricType],
        'هفته (شمسی)': formatJalali(c.weekStartDate),
        'مقدار عددی': c.currentValue,
        'بله/خیر': c.booleanValue === null ? null : c.booleanValue ? 'بله' : 'خیر',
        'گزارش متنی': c.textValue,
        'وضعیت': STATUS_LABELS[c.progressStatus],
        'بلاکر': c.blockerDescription,
        'ثبت‌کننده': c.submittedBy?.fullName ?? null,
        'زمان ثبت': formatJalaliDateTime(c.submittedAt),
        'امتیاز ادمین': c.feedback?.score ?? null,
        'کامنت ادمین': c.feedback?.comment ?? null,
      })),
    };
  }

  if (dataset === 'okrs') {
    const tkrs = await fetchAllTkrs();
    return {
      name: 'okrs',
      rows: tkrs.map((t) => ({
        'دوره': t.keyResult.objective.period,
        'هدف': t.keyResult.objective.title,
        'وزن هدف': t.keyResult.objective.weight,
        'نتیجه کلیدی': t.keyResult.title,
        'نوع سنجش': METRIC_LABELS[t.keyResult.metricType],
        'مشترک': t.keyResult.isShared ? 'بله' : 'خیر',
        'تیم': t.team.name,
        'وزن تیمی': t.weight,
        'حداقل': t.minValueOverride ?? t.keyResult.minValue,
        'تارگت': t.targetValueOverride ?? t.keyResult.targetValue,
        'واحد': t.keyResult.unit,
        'توضیحات': t.keyResult.description,
        'درصد پیشرفت فعلی': tkrProgress(t),
      })),
    };
  }

  if (dataset === 'teams') {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
      include: {
        members: { include: { user: { select: { fullName: true } } } },
        _count: { select: { teamKeyResults: true } },
      },
    });
    return {
      name: 'teams',
      rows: teams.map((t) => ({
        'تیم': t.name,
        'مسئول': t.leadName,
        'توضیحات': t.description,
        'اعضا': t.members.map((m) => m.user.fullName).join('، '),
        'تعداد KR': t._count.teamKeyResults,
      })),
    };
  }

  if (dataset === 'users') {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: { teams: { include: { team: { select: { name: true } } } } },
    });
    return {
      name: 'users',
      rows: users.map((u) => ({
        'نام کاربری': u.username,
        'نام': u.fullName,
        'نقش': u.role === 'ADMIN' ? 'ادمین' : 'عضو تیم',
        'تیم‌ها': u.teams.map((t) => t.team.name).join('، '),
        'فعال': u.isActive ? 'بله' : 'خیر',
        'تاریخ ایجاد': formatJalali(u.createdAt),
      })),
    };
  }

  return null;
}

function toCsv(rows: Row[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | boolean | null) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM برای نمایش درست فارسی در Excel
  return '﻿' + [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

function toMarkdown(rows: Row[], title: string): string {
  if (rows.length === 0) return `# ${title}\n\nداده‌ای موجود نیست.\n`;
  const headers = Object.keys(rows[0]);
  const cell = (v: string | number | boolean | null) =>
    (v === null || v === undefined ? '—' : String(v)).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [
    `# ${title}`,
    '',
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${headers.map((h) => cell(r[h])).join(' | ')} |`),
    '',
  ].join('\n');
}

const DATASET_TITLES: Record<string, string> = {
  checkins: 'چک‌این‌های هفتگی',
  okrs: 'تعریف OKRها (سهم تیمی)',
  teams: 'تیم‌ها',
  users: 'کاربران',
};

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const url = new URL(req.url);
  const dataset = url.searchParams.get('dataset') ?? 'checkins';
  const format = url.searchParams.get('format') ?? 'json';

  const data = await buildDataset(dataset);
  if (!data) return NextResponse.json({ error: 'دیتاست نامعتبر (checkins | okrs | teams | users)' }, { status: 400 });

  const today = formatJalali(new Date()).replace(/\//g, '-');
  const filename = `okr-${data.name}-${today}`;

  if (format === 'csv') {
    return new NextResponse(toCsv(data.rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  }

  if (format === 'md') {
    return new NextResponse(toMarkdown(data.rows, DATASET_TITLES[dataset] ?? dataset), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.md"`,
      },
    });
  }

  if (format === 'json') {
    return new NextResponse(JSON.stringify({ dataset, exportedAt: new Date().toISOString(), rows: data.rows }, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    });
  }

  return NextResponse.json({ error: 'فرمت نامعتبر (csv | md | json)' }, { status: 400 });
}
