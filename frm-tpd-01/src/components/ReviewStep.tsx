import StepShell from './StepShell';
import type { FormState } from '../state';
import {
  filledItems,
  isBug,
  isFastTrack,
  priorityLabel,
  productLabel,
  docTypeLabel,
  requestTypeLabel,
  requesterInfo,
  severityLabel,
} from '../state';
import { MIN_PRINT_SCORE, canPrint, computeScore } from '../lib/scoring';
import { openPrintDialog } from '../lib/print';
import ScoreRing from './ScoreRing';
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
  const outOfScope = filledItems(state.outOfScope);
  const fastTrack = isFastTrack(state);
  const printable = canPrint(score.total);

  return (
    <StepShell
      title="مرور و دریافت سند"
      subtitle="پیش از دریافت PDF، خلاصهٔ سند و امتیاز آمادگی را ببینید"
    >
      <ScoreRing score={score.total} />

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
        <SummaryRow label="نوع درخواست" value={requestTypeLabel(state)} />
        <SummaryRow label="عنوان" value={state.title} />
        <SummaryRow label="محصول هدف" value={productLabel(state)} />
        <SummaryRow label="صورت‌مسئله" value={state.problem} />
        <SummaryRow label="وضعیت مطلوب" value={state.desiredState} />
        <SummaryRow
          label="خارج از دامنه"
          value={outOfScope.map((c, i) => `${toFaDigits(i + 1)}. ${c}`).join('\n')}
        />
        {isBug(state) && (
          <SummaryRow label="شدت و دامنهٔ اثر" value={severityLabel(state.bugSeverity)} />
        )}
        <SummaryRow label="اولویت پیشنهادی" value={priorityLabel(state.priority)} />
      </div>

      <button
        type="button"
        className="btn primary big-print"
        disabled={!printable}
        onClick={() => openPrintDialog(state.title)}
      >
        دریافت PDF
      </button>
      {printable ? (
        <p className="print-note">
          پنجرهٔ چاپ باز می‌شود؛ «ذخیره به‌صورت PDF» را انتخاب کنید و فایل را پیوست تسک
          کنید.
        </p>
      ) : (
        <p className="print-block" aria-live="polite">
          امتیاز آمادگی زیر {toFaDigits(MIN_PRINT_SCORE)} است و سند هنوز قابل دریافت
          نیست. با دکمهٔ «قبلی» برگردید و موارد بالا را کامل کنید.
        </p>
      )}
    </StepShell>
  );
}
