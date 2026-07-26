import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { initialState, reducer, visibleSteps } from '../state';
import type { StepId } from '../state';
import { landingMissing, stepMissing } from '../lib/validate';
import {
  LANDING_PATH,
  pushLanding,
  pushStep,
  replaceLanding,
  replaceStep,
  stepFromPath,
} from '../lib/router';
import { toFaDigits } from '../lib/jalali';
import Landing from './Landing';
import StepRequest from './steps/StepRequest';
import StepProblem from './steps/StepProblem';
import StepScope from './steps/StepScope';
import StepPriority from './steps/StepPriority';
import ReviewStep from './ReviewStep';
import PrintDocument from './PrintDocument';
import Logo from './Logo';
import { openPrintDialog } from '../lib/print';
import { canPrint, computeScore } from '../lib/scoring';

/** نام کوتاه هر مرحله برای نوار پیشرفت */
const STEP_NAMES: Record<StepId, string> = {
  request: 'نوع و مسیر',
  problem: 'شرح مسئله',
  scope: 'دامنه و سنجه',
  priority: 'اولویت',
  review: 'مرور و دریافت',
};

export default function Wizard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stepIndex, setStepIndex] = useState(0);
  /** تا وقتی false است، صفحهٔ آغازین نمایش داده می‌شود و ویزارد شروع نشده */
  const [started, setStarted] = useState(false);

  const steps = useMemo(() => visibleSteps(state), [state]);
  // اگر مرحله‌ای حذف شد و index از انتها گذشت، به آخرین مرحله برگرد
  const index = Math.min(stepIndex, steps.length - 1);
  const current: StepId = steps[index];
  const isLast = index === steps.length - 1;

  const missing = stepMissing(current, state);
  const canAdvance = missing.length === 0;
  // در مرحلهٔ آخر، دکمه فقط با امتیاز آمادگی کافی باز می‌شود
  const canFinish = canPrint(computeScore(state).total);

  const goTo = useCallback(
    (next: number, viaHistory = false) => {
      setStepIndex(next);
      if (!viaHistory) pushStep(steps[next]);
    },
    [steps],
  );

  const goNext = () => {
    if (canAdvance && !isLast) goTo(index + 1);
  };

  const goPrev = () => {
    if (index > 0) goTo(index - 1);
    // از مرحلهٔ ۱ به صفحهٔ آغازین برمی‌گردیم
    else {
      setStarted(false);
      pushLanding();
    }
  };

  const start = () => {
    setStarted(true);
    setStepIndex(0);
    pushStep(steps[0]);
  };

  // هر بار که اپ باز می‌شود از صفحهٔ آغازین شروع می‌کند؛ ورود مستقیم به یک
  // مرحله معتبر نیست چون هیچ داده‌ای بین بارگذاری‌ها نگه داشته نمی‌شود.
  useEffect(() => {
    replaceLanding();
  }, []);

  // دکمهٔ back مرورگر: بین مراحل و صفحهٔ آغازین عقب می‌رود
  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname === LANDING_PATH) {
        setStarted(false);
        return;
      }
      const step = stepFromPath(window.location.pathname);
      const target = step ? steps.indexOf(step) : -1;
      setStarted(true);
      setStepIndex(target >= 0 ? target : 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [steps]);

  // اگر فهرست مراحل عوض شد (افزودن/حذف مرحلهٔ دامنه)، آدرس را هم‌گام کن
  useEffect(() => {
    if (started) replaceStep(steps[index]);
  }, [started, steps, index]);

  // Enter = مرحلهٔ بعد (فقط وقتی مرحله کامل است)؛ داخل textarea نه
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented || isLast || !canAdvance) return;
      if (!started) return;
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'TEXTAREA') return;
      setStepIndex((i) => {
        const next = Math.min(i + 1, steps.length - 1);
        pushStep(steps[next]);
        return next;
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canAdvance, isLast, started, steps]);

  // با تعویض مرحله، به بالای صفحه برگرد
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index, started]);

  /** اتمام فرآیند: تا انتهای سند اسکرول کن، بعد پنجرهٔ چاپ را باز کن */
  const finish = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    window.setTimeout(() => openPrintDialog(state.title), 600);
  };

  if (!started) {
    const gaps = landingMissing(state);
    return (
      <>
        <div id="app-root" className="app app-landing">
          <Landing
            state={state}
            dispatch={dispatch}
            canStart={gaps.length === 0}
            missing={gaps}
            onStart={start}
          />
        </div>
        <PrintDocument state={state} />
      </>
    );
  }

  return (
    <>
      <div id="app-root" className="app">
        <header className="app-header">
          <div className="brand">
            <Logo size={44} />
            <div className="brand-text">
              <span className="brand-title">فرم ثبت درخواست کار</span>
              <span className="brand-sub">
                FRM-TPD-01 · نسخهٔ ۳٫۰ — دپارتمان فناوری و محصول
              </span>
            </div>
          </div>

          <nav
            className="progress"
            aria-label={`مرحله ${index + 1} از ${steps.length}`}
          >
            {steps.map((s, i) => (
              <button
                key={s}
                type="button"
                // فقط برگشت به مراحل قبلی مجاز است، نه پرش به جلو
                disabled={i >= index}
                tabIndex={-1}
                className={`progress-step${i === index ? ' current' : ''}${
                  i < index ? ' done' : ''
                }`}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => goTo(i)}
              >
                <span className="progress-dot-wrap">
                  <span className="progress-dot">{toFaDigits(i + 1)}</span>
                </span>
                <span className="progress-name">{STEP_NAMES[s]}</span>
              </button>
            ))}
          </nav>
        </header>

        <main className="card">
          {/* key باعث اجرای انیمیشن fade+slide هنگام تعویض مرحله می‌شود */}
          <div className="step-container" key={current}>
            {current === 'request' && <StepRequest state={state} dispatch={dispatch} />}
            {current === 'problem' && <StepProblem state={state} dispatch={dispatch} />}
            {current === 'scope' && <StepScope state={state} dispatch={dispatch} />}
            {current === 'priority' && <StepPriority state={state} dispatch={dispatch} />}
            {current === 'review' && <ReviewStep state={state} />}
          </div>
        </main>

        <nav className="navbar">
          <div className="navbar-inner">
            <button
              type="button"
              className="btn ghost"
              onClick={goPrev}
            >
              → {index === 0 ? 'بازگشت' : 'قبلی'}
            </button>

            <span className="navbar-center">
              <span className="navbar-status">
                مرحله {toFaDigits(index + 1)} از {toFaDigits(steps.length)}
              </span>
              {!isLast && !canAdvance && (
                <span className="navbar-missing" aria-live="polite">
                  برای ادامه: {missing.join('، ')}
                </span>
              )}
              {isLast && !canFinish && (
                <span className="navbar-missing" aria-live="polite">
                  امتیاز آمادگی برای دریافت سند کافی نیست
                </span>
              )}
            </span>

            {isLast ? (
              <button
                type="button"
                className="btn primary"
                onClick={finish}
                disabled={!canFinish}
              >
                اتمام فرآیند
              </button>
            ) : (
              <button
                type="button"
                className="btn primary"
                onClick={goNext}
                disabled={!canAdvance}
              >
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
