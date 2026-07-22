import { useEffect, useMemo, useReducer, useState } from 'react';
import { initialState, reducer, visibleSteps } from '../state';
import type { StepId } from '../state';
import { missingMessage, stepMissing } from '../lib/validate';
import { toFaDigits } from '../lib/jalali';
import StepPerson from './steps/StepPerson';
import StepType from './steps/StepType';
import StepProblem from './steps/StepProblem';
import StepCriteria from './steps/StepCriteria';
import StepBug from './steps/StepBug';
import StepSchedule from './steps/StepSchedule';
import ReviewStep from './ReviewStep';
import PrintDocument from './PrintDocument';

export default function Wizard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(() => visibleSteps(state), [state]);
  // اگر مرحلهٔ باگ حذف شد و index از انتها گذشت، به آخرین مرحله برگرد
  const index = Math.min(stepIndex, steps.length - 1);
  const current: StepId = steps[index];
  const isLast = index === steps.length - 1;

  const goNext = () => {
    const missing = stepMissing(current, state);
    if (missing.length > 0) {
      setError(missingMessage(missing));
      return;
    }
    setError(null);
    if (!isLast) setStepIndex(index + 1);
  };

  const goPrev = () => {
    setError(null);
    if (index > 0) setStepIndex(index - 1);
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
        setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, state, isLast, steps.length]);

  // با تعویض مرحله، به بالای صفحه برگرد
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  return (
    <>
      <div id="app-root" className="app">
        <header className="app-header">
          <p className="form-code">
            FRM-TPD-01 · نسخهٔ ۲٫۰ — دپارتمان فناوری و محصول (CPTO)
          </p>
          <p className="step-counter" aria-live="polite">
            مرحله {toFaDigits(index + 1)} از {toFaDigits(steps.length)}
          </p>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={index + 1}
          >
            {steps.map((s, i) => (
              <span key={s} className={`progress-seg${i <= index ? ' filled' : ''}`} />
            ))}
          </div>
        </header>

        <main className="card">
          {/* key باعث اجرای انیمیشن fade+slide هنگام تعویض مرحله می‌شود */}
          <div className="step-container" key={current}>
            {current === 'person' && <StepPerson state={state} dispatch={dispatch} />}
            {current === 'type' && <StepType state={state} dispatch={dispatch} />}
            {current === 'problem' && <StepProblem state={state} dispatch={dispatch} />}
            {current === 'criteria' && <StepCriteria state={state} dispatch={dispatch} />}
            {current === 'bug' && <StepBug state={state} dispatch={dispatch} />}
            {current === 'schedule' && <StepSchedule state={state} dispatch={dispatch} />}
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
