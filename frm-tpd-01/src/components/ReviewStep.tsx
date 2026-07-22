import StepShell from './StepShell';
import type { FormState } from '../state';
import {
  criterionSentence,
  isCriterionComplete,
  isFastTrack,
  priorityLabel,
  requestTypeLabel,
  severityLabel,
} from '../state';
import { findPerson } from '../data/people';
import { computeScore } from '../lib/scoring';
import { toFaDigits, todayJalaliLabel } from '../lib/jalali';

interface Props {
  state: FormState;
}

/** تغییر عنوان صفحه برای نام‌گذاری خودکار فایل PDF، سپس چاپ و بازگرداندن عنوان */
function handlePrint(title: string) {
  const prevTitle = document.title;
  const firstWords = title.trim().split(/\s+/).filter(Boolean).slice(0, 5).join(' ');
  document.title = `FRM-TPD-01_${firstWords || 'درخواست کار'}`;
  const restore = () => {
    document.title = prevTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
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
  const person = findPerson(state.personId);
  const completeCriteria = state.criteria.filter(isCriterionComplete);
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
        <SummaryRow label="درخواست‌دهنده" value={person ? `${person.name} — ${person.role}` : ''} />
        <SummaryRow label="تاریخ ثبت" value={todayJalaliLabel()} />
        <SummaryRow label="نوع درخواست" value={requestTypeLabel(state.requestType)} />
        <SummaryRow label="عنوان" value={state.title} />
        <SummaryRow label="محصول هدف" value={state.product ?? ''} />
        <SummaryRow label="صورت‌مسئله" value={state.problem} />
        <SummaryRow label="وضعیت مطلوب" value={state.desiredState} />
        <SummaryRow
          label="معیارهای پذیرش"
          value={
            completeCriteria.length
              ? completeCriteria.map((c, i) => `${toFaDigits(i + 1)}. ${criterionSentence(c)}`).join(' ')
              : ''
          }
        />
        {state.requestType === 'bug' && (
          <SummaryRow label="شدت باگ" value={severityLabel(state.bugSeverity)} />
        )}
        <SummaryRow label="اولویت پیشنهادی" value={priorityLabel(state.priority)} />
        <SummaryRow
          label="مسیر بررسی"
          value={fastTrack ? '✓ مسیر سریع (Fast-Track)' : 'مسیر عادی'}
        />
      </div>

      <button
        type="button"
        className="btn primary big-print"
        onClick={() => handlePrint(state.title)}
      >
        دریافت PDF
      </button>
      <p className="print-note">
        پنجرهٔ چاپ باز می‌شود؛ «ذخیره به‌صورت PDF» را انتخاب کنید و فایل را پیوست تسک کنید.
      </p>
    </StepShell>
  );
}
