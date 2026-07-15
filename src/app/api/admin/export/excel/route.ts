import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireAdmin } from '@/lib/auth';
import { formatJalali } from '@/lib/jalali';
import {
  fetchAllTkrs,
  getDepartmentOverview,
  latestValueLabel,
  tkrAutoStatus,
  tkrExpected,
  tkrProgress,
} from '@/lib/okr-data';
import { AUTO_STATUS_LABELS, STATUS_LABELS, METRIC_LABELS } from '@/lib/progress';

export const runtime = 'nodejs';

/** خروجی اکسل: شیت ۱ = خلاصه تیم‌ها، شیت ۲ = آخرین وضعیت همه‌ی KRها */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === 'unauthorized' ? 401 : 403 });

  const [{ overviews, departmentProgress }, tkrs] = await Promise.all([
    getDepartmentOverview(),
    fetchAllTkrs(),
  ]);

  const summaryRows = overviews.map((o) => ({
    'تیم': o.teamName,
    'مسئول تیم': o.leadName ?? '',
    'درصد پیشرفت': o.progress,
    'تعداد KR': o.krCount,
    'در مسیر': o.statusCounts.ON_TRACK,
    'در ریسک': o.statusCounts.AT_RISK,
    'بلاک‌شده': o.statusCounts.BLOCKED,
    'تکمیل‌شده': o.statusCounts.COMPLETED,
    'آخرین چک‌این': o.lastCheckInAt ? formatJalali(o.lastCheckInAt) : '—',
  }));
  summaryRows.push({
    'تیم': 'کل دپارتمان',
    'مسئول تیم': '',
    'درصد پیشرفت': departmentProgress,
    'تعداد KR': tkrs.length,
    'در مسیر': overviews.reduce((s, o) => s + o.statusCounts.ON_TRACK, 0),
    'در ریسک': overviews.reduce((s, o) => s + o.statusCounts.AT_RISK, 0),
    'بلاک‌شده': overviews.reduce((s, o) => s + o.statusCounts.BLOCKED, 0),
    'تکمیل‌شده': overviews.reduce((s, o) => s + o.statusCounts.COMPLETED, 0),
    'آخرین چک‌این': '',
  });

  const detailRows = tkrs.map((tkr) => {
    const latest = tkr.checkIns[0];
    return {
      'تیم': tkr.team.name,
      'دوره': tkr.keyResult.objective.period,
      'هدف': tkr.keyResult.objective.title,
      'نتیجه کلیدی': tkr.keyResult.title,
      'نوع سنجش': METRIC_LABELS[tkr.keyResult.metricType],
      'مشترک': tkr.keyResult.isShared ? 'بله' : 'خیر',
      'وزن تیمی': tkr.weight,
      'حداقل': tkr.minValueOverride ?? tkr.keyResult.minValue ?? '',
      'تارگت': tkr.targetValueOverride ?? tkr.keyResult.targetValue ?? '',
      'واحد': tkr.keyResult.unit ?? '',
      'آخرین مقدار': latestValueLabel(tkr),
      'درصد پیشرفت': tkrProgress(tkr),
      'انتظار زمانی (٪)': tkrExpected(tkr) ?? '',
      'وضعیت زمانی (خودکار)': (() => {
        const auto = tkrAutoStatus(tkr);
        return auto ? AUTO_STATUS_LABELS[auto] : '';
      })(),
      'وضعیت': latest ? STATUS_LABELS[latest.progressStatus] : 'بدون چک‌این',
      'بلاکر': latest?.blockerDescription ?? '',
      'تاریخ آخرین چک‌این': latest ? formatJalali(latest.weekStartDate) : '',
      'امتیاز ادمین': latest?.feedback?.score ?? '',
      'کامنت ادمین': latest?.feedback?.comment ?? '',
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'خلاصه تیم‌ها');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), 'جزئیات KRها');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  const today = formatJalali(new Date()).replace(/\//g, '-');
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="okr-report-${today}.xlsx"`,
    },
  });
}
