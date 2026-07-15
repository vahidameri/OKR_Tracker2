import * as XLSX from 'xlsx';
import { MetricType } from '@prisma/client';

/** ستون‌های مورد انتظار فایل اکسل (سطر اول = هدر) */
export const IMPORT_HEADERS = [
  'هدف',
  'توضیحات هدف',
  'وزن هدف',
  'دوره',
  'نتیجه کلیدی',
  'وزن نتیجه کلیدی',
  'نوع سنجش',
  'حداقل',
  'تارگت',
  'واحد',
  'توضیحات',
  'تیم‌ها',
  'وزن تیمی',
  'تارگت تیمی',
] as const;

export interface ParsedTeamAssignment {
  teamName: string;
  teamId: string | null;
  weight: number;
  targetValueOverride: number | null;
}

export interface ParsedRow {
  rowNumber: number;
  objectiveTitle: string;
  objectiveDescription: string | null;
  objectiveWeight: number;
  period: string;
  krTitle: string;
  krWeight: number;
  metricType: MetricType;
  minValue: number | null;
  targetValue: number | null;
  unit: string | null;
  description: string | null;
  teams: ParsedTeamAssignment[];
  errors: string[];
}

const METRIC_MAP: Record<string, MetricType> = {
  'عددی': 'NUMERIC',
  'numeric': 'NUMERIC',
  'بله/خیر': 'BOOLEAN',
  'بله خیر': 'BOOLEAN',
  'boolean': 'BOOLEAN',
  'محتوایی': 'TEXT',
  'کیفی': 'TEXT',
  'text': 'TEXT',
};

function cellStr(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/** تبدیل ارقام فارسی/عربی به لاتین و پارس عدد */
function cellNum(value: unknown): number | null {
  const s = cellStr(value)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[,،٬\s]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function splitList(value: unknown): string[] {
  return cellStr(value)
    .split(/[،,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseImportWorkbook(
  buffer: Buffer,
  teams: { id: string; name: string }[],
  defaultPeriod: string
): ParsedRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const teamByName = new Map(teams.map((t) => [t.name.trim(), t]));

  return rows.map((row, i) => {
    const get = (key: string) => row[key];
    const errors: string[] = [];

    const objectiveTitle = cellStr(get('هدف'));
    const krTitle = cellStr(get('نتیجه کلیدی'));
    if (!objectiveTitle) errors.push('ستون «هدف» خالی است');
    if (!krTitle) errors.push('ستون «نتیجه کلیدی» خالی است');

    const metricRaw = cellStr(get('نوع سنجش')).toLowerCase();
    const metricType = metricRaw ? METRIC_MAP[metricRaw] : 'NUMERIC';
    if (metricRaw && !metricType) {
      errors.push(`نوع سنجش نامعتبر: «${metricRaw}» (مجاز: عددی، بله/خیر، محتوایی)`);
    }

    const objectiveWeight = cellNum(get('وزن هدف'));
    const krWeight = cellNum(get('وزن نتیجه کلیدی'));
    const minValue = cellNum(get('حداقل'));
    const targetValue = cellNum(get('تارگت'));
    for (const [label, v] of [
      ['وزن هدف', objectiveWeight],
      ['وزن نتیجه کلیدی', krWeight],
      ['حداقل', minValue],
      ['تارگت', targetValue],
    ] as const) {
      if (v !== null && Number.isNaN(v)) errors.push(`مقدار «${label}» عدد معتبر نیست`);
    }

    const effectiveMetric: MetricType = metricType ?? 'NUMERIC';
    if (effectiveMetric === 'NUMERIC' && (targetValue === null || Number.isNaN(targetValue))) {
      errors.push('برای نوع سنجش عددی، «تارگت» الزامی است');
    }

    const teamNames = splitList(get('تیم‌ها'));
    if (teamNames.length === 0) errors.push('ستون «تیم‌ها» خالی است (حداقل یک تیم)');

    const teamWeights = splitList(get('وزن تیمی')).map((s) => cellNum(s));
    const teamTargets = splitList(get('تارگت تیمی')).map((s) => cellNum(s));

    const parsedTeams: ParsedTeamAssignment[] = teamNames.map((name, idx) => {
      const team = teamByName.get(name);
      if (!team) errors.push(`تیم «${name}» در سیستم تعریف نشده است`);
      const w = teamWeights[idx];
      if (w !== undefined && (w === null || Number.isNaN(w) || w <= 0)) {
        errors.push(`وزن تیمی نامعتبر برای «${name}»`);
      }
      return {
        teamName: name,
        teamId: team?.id ?? null,
        weight: w && !Number.isNaN(w) && w > 0 ? w : (krWeight && !Number.isNaN(krWeight) ? krWeight : 1),
        targetValueOverride:
          teamTargets[idx] !== undefined && teamTargets[idx] !== null && !Number.isNaN(teamTargets[idx]!)
            ? teamTargets[idx]
            : null,
      };
    });

    return {
      rowNumber: i + 2, // با احتساب سطر هدر
      objectiveTitle,
      objectiveDescription: cellStr(get('توضیحات هدف')) || null,
      objectiveWeight: objectiveWeight && !Number.isNaN(objectiveWeight) ? objectiveWeight : 1,
      period: cellStr(get('دوره')) || defaultPeriod,
      krTitle,
      krWeight: krWeight && !Number.isNaN(krWeight) ? krWeight : 1,
      metricType: effectiveMetric,
      minValue: minValue !== null && !Number.isNaN(minValue) ? minValue : null,
      targetValue: targetValue !== null && !Number.isNaN(targetValue) ? targetValue : null,
      unit: cellStr(get('واحد')) || null,
      description: cellStr(get('توضیحات')) || null,
      teams: parsedTeams,
      errors,
    };
  });
}

export function buildTemplateWorkbook(): Buffer {
  const sample = [
    {
      'هدف': 'افزایش تعامل کاربران',
      'توضیحات هدف': 'رشد شاخص‌های تعامل در فصل جاری',
      'وزن هدف': 2,
      'دوره': 'Q2-1405',
      'نتیجه کلیدی': 'رسیدن کاربران فعال روزانه به ۵ میلیون',
      'وزن نتیجه کلیدی': 3,
      'نوع سنجش': 'عددی',
      'حداقل': 3500000,
      'تارگت': 5000000,
      'واحد': 'نفر',
      'توضیحات': 'DAU تجمیعی',
      'تیم‌ها': 'ورزشی، تماشا',
      'وزن تیمی': '2، 1',
      'تارگت تیمی': '3000000، 2000000',
    },
    {
      'هدف': 'افزایش تعامل کاربران',
      'توضیحات هدف': '',
      'وزن هدف': 2,
      'دوره': 'Q2-1405',
      'نتیجه کلیدی': 'راه‌اندازی قابلیت گزارش لحظه‌ای',
      'وزن نتیجه کلیدی': 1,
      'نوع سنجش': 'بله/خیر',
      'حداقل': '',
      'تارگت': '',
      'واحد': '',
      'توضیحات': '',
      'تیم‌ها': 'تکنولوژی',
      'وزن تیمی': '',
      'تارگت تیمی': '',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample, { header: [...IMPORT_HEADERS] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'OKRs');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
