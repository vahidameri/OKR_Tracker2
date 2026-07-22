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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th>{label}</th>
      <td>{value || '—'}</td>
    </tr>
  );
}

/** قالب سند رسمی — فقط در حالت چاپ (@media print) نمایش داده می‌شود */
export default function PrintDocument({ state }: Props) {
  const person = findPerson(state.personId);
  const score = computeScore(state);
  const fastTrack = isFastTrack(state);
  const completeCriteria = state.criteria.filter(isCriterionComplete);
  const outOfScope = [state.outOfScope1, state.outOfScope2]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ');

  return (
    <div id="print-doc" dir="rtl">
      <header className="doc-header">
        <div className="doc-header-title">
          <div className="doc-fa">فرم ثبت درخواست کار / Work Request Form — FRM-TPD-01</div>
          <div className="doc-org">همراه اول (MCI) — دپارتمان فناوری و محصول CPTO</div>
        </div>
      </header>

      <div className="doc-meta">
        <span>کد سند: FRM-TPD-01</span>
        <span>نسخهٔ ۲٫۰</span>
        <span>تاریخ ثبت: {todayJalaliLabel()}</span>
        <span>
          امتیاز آمادگی: {toFaDigits(score.total)} از {toFaDigits(100)}
        </span>
      </div>

      <section className="doc-section">
        <h2 className="doc-section-title">بخش ۱ — مشخصات درخواست</h2>
        <table className="doc-table">
          <tbody>
            <Row label="درخواست‌دهنده" value={person ? `${person.name} — ${person.role}` : ''} />
            <Row label="نوع درخواست" value={requestTypeLabel(state.requestType)} />
            <Row label="عنوان درخواست" value={state.title} />
            <Row label="محصول هدف" value={state.product ?? ''} />
            <tr>
              <th>مسیر بررسی (خودکار)</th>
              <td>
                {fastTrack ? (
                  <span className="doc-fasttrack">✓ واجد شرایط مسیر سریع (Fast-Track)</span>
                ) : (
                  'مسیر عادی'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="doc-section">
        <h2 className="doc-section-title">بخش ۲ — شرح مسئله</h2>
        <table className="doc-table">
          <tbody>
            <Row label="صورت‌مسئله" value={state.problem} />
            <Row label="وضعیت فعلی" value={state.currentState} />
            <Row label="وضعیت مطلوب" value={state.desiredState} />
            <Row label="ارزش کسب‌وکاری" value={state.businessValue} />
          </tbody>
        </table>
      </section>

      <section className="doc-section">
        <h2 className="doc-section-title">بخش ۳ — معیارهای پذیرش و دامنه</h2>
        <table className="doc-table">
          <tbody>
            <tr>
              <th>معیارهای پذیرش</th>
              <td>
                {completeCriteria.length ? (
                  <ol className="doc-criteria">
                    {completeCriteria.map((c) => (
                      <li key={c.id}>{criterionSentence(c)}</li>
                    ))}
                  </ol>
                ) : (
                  '—'
                )}
              </td>
            </tr>
            <Row label="خارج از دامنه" value={outOfScope} />
            <Row label="سنجهٔ موفقیت" value={state.successMetric} />
            <Row label="اولویت پیشنهادی" value={priorityLabel(state.priority)} />
            <Row label="تاریخ نیاز و دلیل" value={state.neededDate} />
            <Row label="وابستگی‌ها و پیوست‌ها" value={state.dependencies} />
          </tbody>
        </table>
      </section>

      {state.requestType === 'bug' && (
        <section className="doc-section">
          <h2 className="doc-section-title">بخش ۴ — اطلاعات تکمیلی باگ</h2>
          <table className="doc-table">
            <tbody>
              <Row label="مراحل بازتولید" value={state.bugSteps} />
              <Row label="نتیجهٔ مشاهده‌شده" value={state.bugObserved} />
              <Row label="نتیجهٔ مورد انتظار" value={state.bugExpected} />
              <Row label="محیط، نسخه و دستگاه" value={state.bugEnv} />
              <Row label="شدت پیشنهادی" value={severityLabel(state.bugSeverity)} />
            </tbody>
          </table>
        </section>
      )}

      <section className="doc-section doc-pm">
        <h2 className="doc-section-title pm">بخش ۵ — مخصوص مدیر برنامه</h2>
        <table className="doc-table pm-table">
          <tbody>
            {[
              'شناسهٔ تسک',
              'نتیجهٔ بررسی اولیه و تاریخ',
              'تیم مجری و مجری',
              'اولویت نهایی و مبنای آن',
              'اسپرینت هدف',
            ].map((label) => (
              <tr key={label}>
                <th>{label}</th>
                {/* ردیف خالی — توسط مدیر برنامه تکمیل می‌شود */}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="doc-footer">
        این سند توسط وب‌اپ FRM-TPD-01 تولید شده است · پاسخ اولیه حداکثر ظرف ۲ روز کاری
      </footer>
    </div>
  );
}
