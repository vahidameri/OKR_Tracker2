import { useEffect, useMemo, useReducer, useState } from 'react';
import { initialState, reducer, visibleSteps } from '../state';
import type { StepId } from '../state';
import { missingMessage, stepMissing } from '../lib/validate';
import { toFaDigits } from '../lib/jalali';
import StepPerson from './steps/StepPerson';
import StepTriage from './steps/StepTriage';
import StepProblem from './steps/StepProblem';
import StepCriteria from './steps/StepCriteria';
import StepBug from './steps/StepBug';
import StepPriority from './steps/StepPriority';
import ReviewStep from './ReviewStep';
import PrintDocument from './PrintDocument';

/** نام کوتاه هر مرحله برای نوار پیشرفت */
const STEP_NAMES: Record<StepId, string> = {
  person: 'درخواست‌دهنده',
  triage: 'مسیر و مشخصات',
  problem: 'شرح مسئله',
  criteria: 'معیارها و دامنه',
  bug: 'جزئیات باگ',
  priority: 'اولویت',
  review: 'مرور و دریافت',
};

export default function Wizard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** بیشترین مرحله‌ای که کاربر به آن رسیده — برای برگشت سریع از نوار پیشرفت */
  const [maxReached, setMaxReached] = useState(0);

  const steps = useMemo(() => visibleSteps(state), [state]);
  // اگر مرحلهٔ باگ حذف شد و index از انتها گذشت، به آخرین مرحله برگرد
  const index = Math.min(stepIndex, steps.length - 1);
  const current: StepId = steps[index];
  const isLast = index === steps.length - 1;

  const goTo = (next: number) => {
    setError(null);
    setStepIndex(next);
    setMaxReached((m) => Math.max(m, next));
  };

  const goNext = () => {
    const missing = stepMissing(current, state);
    if (missing.length > 0) {
      setError(missingMessage(missing));
      return;
    }
    if (!isLast) goTo(index + 1);
  };

  const goPrev = () => {
    if (index > 0) goTo(index - 1);
  };

  // Enter = مرحلهٔ بعد (وقتی معتبر است)؛ داخل textarea یا دراپ‌داون باز نه
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented || isLast) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'))
        return;
      const missing = stepMissing(current, state);
      if (missing.length === 0) {
        setError(null);
        setStepIndex((i) => {
          const next = Math.min(i + 1, steps.length - 1);
          setMaxReached((m) => Math.max(m, next));
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, state, isLast, steps.length]);

  // با تعویض مرحله، به بالای صفحه برگرد
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index]);

  // به‌محض اینکه کاربر چیزی را تغییر داد، پیام خطای قبلی پاک شود
  useEffect(() => {
    setError(null);
  }, [state]);

  return (
    <>
      <div id="app-root" className="app">
        <header className="app-header">
          <p className="form-code">
            FRM-TPD-01 · نسخهٔ ۲٫۰ — دپارتمان فناوری و محصول (CPTO)
          </p>

          <nav
            className="progress"
            aria-label={`مرحله ${index + 1} از ${steps.length}`}
          >
            {steps.map((s, i) => (
              <button
                key={s}
                type="button"
                className={`progress-step${i === index ? ' current' : ''}${
                  i < index ? ' done' : ''
                }`}
                // فقط به مراحلی که قبلاً دیده شده‌اند می‌شود پرید
                disabled={i > maxReached}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => goTo(i)}
              >
                <span className="progress-dot">{toFaDigits(i + 1)}</span>
                <span className="progress-name">{STEP_NAMES[s]}</span>
              </button>
            ))}
          </nav>
        </header>

        <main className="card">
          {/* key باعث اجرای انیمیشن fade+slide هنگام تعویض مرحله می‌شود */}
          <div className="step-container" key={current}>
            {current === 'person' && <StepPerson state={state} dispatch={dispatch} />}
            {current === 'triage' && <StepTriage state={state} dispatch={dispatch} />}
            {current === 'problem' && <StepProblem state={state} dispatch={dispatch} />}
            {current === 'criteria' && <StepCriteria state={state} dispatch={dispatch} />}
            {current === 'bug' && <StepBug state={state} dispatch={dispatch} />}
            {current === 'priority' && <StepPriority state={state} dispatch={dispatch} />}
            {current === 'review' && <ReviewStep state={state} />}
          </div>
          {error && (
            <p className="step-error" role="alert">
              {error}
            </p>
          )}
        </main>

        <nav className="navbar">
          <div className="navbar-inner">
            <button
              type="button"
              className="btn ghost"
              onClick={goPrev}
              disabled={index === 0}
            >
              → قبلی
            </button>
            <span className="navbar-status">
              مرحله {toFaDigits(index + 1)} از {toFaDigits(steps.length)}
            </span>
            {!isLast && (
              <button type="button" className="btn primary" onClick={goNext}>
                بعدی ←
              </button>
            )}
          </div>
        </nav>
      </div>

      <PrintDocument state={state} />
    </>
  );
}
