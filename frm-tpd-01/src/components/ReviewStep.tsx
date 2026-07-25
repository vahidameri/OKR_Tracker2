import StepShell from './StepShell';
import type { FormState } from '../state';
import {
  filledItems,
  isBug,
  isFastTrack,
  priorityLabel,
  docTypeLabel,
  requestTypesLabel,
  requesterInfo,
  severityLabel,
} from '../state';
import { computeScore } from '../lib/scoring';
import { openPrintDialog } from '../lib/print';
import { toFaDigits, todayJalaliLabel } from '../lib/jalali';

interface Props {
  state: FormState;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-row">
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value || '—'}</span>
    </div>
  );
}

export default function ReviewStep({ state }: Props) {
  const score = computeScore(state);
  const requester = requesterInfo(state);
  const criteria = filledItems(state.criteria);
  const fastTrack = isFastTrack(state);

  return (
    <StepShell
      title="مرور و دریافت سند"
      subtitle="پیش از دریافت PDF، خلاصهٔ سند و امتیاز آمادگی را ببینید"
    >
      <div className="score-box">
        <div
          className={`score-number ${score.total >= 70 ? 'good' : 'bad'}`}
          aria-label={`امتیاز آمادگی: ${score.total} از ۱۰۰`}
        >
          {toFaDigits(score.total)}
        </div>
        <div className="score-caption">امتیاز آمادگی از {toFaDigits(100)}</div>
      </div>

      {/* یادداشت موقت — تا زمانی که نمره‌دهی محتوا‌محور اضافه شود */}
      <p className="score-note">
        این بخش در حال تکمیل است؛ فعلاً امتیاز صرفاً بر اساس فیلدهای تکمیل‌شده محاسبه
        می‌شود و کیفیت محتوای نوشته‌شده را نمی‌سنجد.
      </p>

      {score.missing.length > 0 && (
        <div className="improve-box">
          <strong>برای بهترشدن سند</strong>
          <ul>
            {score.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="summary-card">
        <SummaryRow
          label="درخواست‌دهنده"
          value={
            requester
              ? requester.role
                ? `${requester.name} — ${requester.role}`
                : requester.name
              : ''
          }
        />
        <SummaryRow label="نوع سند" value={docTypeLabel(state.docType)} />
        <SummaryRow label="تاریخ ثبت" value={todayJalaliLabel()} />
        <SummaryRow
          label="مسیر بررسی"
          value={fastTrack ? '✓ مسیر سریع (Fast-Track)' : 'مسیر عادی'}
        />
        <SummaryRow label="نوع درخواست" value={requestTypesLabel(state.requestTypes)} />
        <SummaryRow label="عنوان" value={state.title} />
        <SummaryRow label="محصول هدف" value={state.product ?? ''} />
        <SummaryRow label="صورت‌مسئله" value={state.problem} />
        <SummaryRow label="وضعیت مطلوب" value={state.desiredState} />
        <SummaryRow
          label="معیارهای پذیرش"
          value={criteria.map((c, i) => `${toFaDigits(i + 1)}. ${c}`).join('\n')}
        />
        {isBug(state) && (
          <SummaryRow label="شدت باگ" value={severityLabel(state.bugSeverity)} />
        )}
        <SummaryRow label="اولویت پیشنهادی" value={priorityLabel(state.priority)} />
      </div>

      <button
        type="button"
        className="btn primary big-print"
        onClick={() => openPrintDialog(state.title)}
      >
        دریافت PDF
      </button>
      <p className="print-note">
        پنجرهٔ چاپ باز می‌شود؛ «ذخیره به‌صورت PDF» را انتخاب کنید و فایل را پیوست تسک کنید.
      </p>
    </StepShell>
  );
}
