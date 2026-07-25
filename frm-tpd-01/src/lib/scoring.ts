// امتیاز آمادگی سند از ۱۰۰ + فهرست کمبودها برای جعبهٔ «برای بهترشدن سند»
// توجه: این محاسبه فعلاً فقط بر اساس تکمیل‌بودن فیلدهاست و کیفیت محتوا را نمی‌سنجد.

import type { FormState } from '../state';
import { filledItems, isBug, isFastTrack } from '../state';

export interface ScoreResult {
  total: number;
  missing: string[];
}

const MIN_PROBLEM_CHARS = 40;

/**
 * وزن‌ها بر حسب مسیر بررسی فرق می‌کند: در مسیر سریع، فیلدهای ارزش کسب‌وکاری،
 * خارج از دامنه و وابستگی‌ها غیرفعال‌اند، پس نباید در امتیاز کسر شوند و
 * سهمشان بین باقی محورها توزیع می‌شود.
 */
const WEIGHTS = {
  normal: { problem: 12, current: 6, desired: 7, criteria: 25, value: 20, scope: 15, tech: 15 },
  fast: { problem: 16, current: 8, desired: 11, criteria: 35, value: 0, scope: 0, tech: 30 },
};

export function computeScore(state: FormState): ScoreResult {
  const fast = isFastTrack(state);
  const w = fast ? WEIGHTS.fast : WEIGHTS.normal;
  let total = 0;
  const missing: string[] = [];

  // شفافیت صورت‌مسئله
  const problemLen = state.problem.trim().length;
  if (problemLen >= MIN_PROBLEM_CHARS) {
    total += w.problem;
  } else if (problemLen > 0) {
    total += w.problem / 2;
    missing.push('صورت‌مسئله را کمی کامل‌تر بنویسید (حدود ۴۰ کاراکتر یا بیشتر).');
  } else {
    missing.push('صورت‌مسئله نوشته نشده است.');
  }
  if (state.currentState.trim()) total += w.current;
  else missing.push('«وضعیت فعلی» خالی است؛ در صورت امکان با شاهد کمی بنویسید.');
  if (state.desiredState.trim()) total += w.desired;
  else missing.push('«وضعیت مطلوب» خالی است.');

  // معیارهای پذیرش — دو مورد یا بیشتر = کامل
  const criteria = filledItems(state.criteria);
  if (criteria.length >= 2) {
    total += w.criteria;
  } else if (criteria.length === 1) {
    total += w.criteria / 2;
    missing.push('دست‌کم یک معیار پذیرش دیگر اضافه کنید.');
  } else {
    missing.push('هیچ معیار پذیرشی نوشته نشده است.');
  }

  // ارزش کسب‌وکاری (در مسیر سریع لازم نیست)
  if (w.value > 0) {
    if (state.businessValue.trim()) total += w.value;
    else missing.push('«ارزش کسب‌وکاری» خالی است؛ بنویسید اگر انجام نشود چه از دست می‌رود.');
  }

  // خارج از دامنه (در مسیر سریع لازم نیست)
  if (w.scope > 0) {
    const scope = filledItems(state.outOfScope);
    if (scope.length >= 2) total += w.scope;
    else if (scope.length === 1) {
      total += w.scope / 2;
      missing.push('مورد دوم «خارج از دامنه» را هم مشخص کنید.');
    } else {
      missing.push('«خارج از دامنه» مشخص نشده است (دست‌کم دو مورد).');
    }
  }

  // اطلاعات فنی / وابستگی
  if (isBug(state)) {
    const parts = [
      { ok: !!state.bugEnv.trim(), msg: '«محیط، نسخه و دستگاه» باگ را مشخص کنید.' },
      { ok: !!state.bugObserved.trim(), msg: '«نتیجهٔ مشاهده‌شده» باگ خالی است.' },
      { ok: !!state.bugExpected.trim(), msg: '«نتیجهٔ مورد انتظار» باگ خالی است.' },
    ];
    for (const p of parts) {
      if (p.ok) total += w.tech / 3;
      else missing.push(p.msg);
    }
  } else if (fast) {
    // در مسیر سریع و بدون باگ، اطلاعات فنی جداگانه‌ای خواسته نمی‌شود
    total += w.tech;
  } else if (state.dependencies.trim()) {
    total += w.tech;
  } else {
    missing.push('«وابستگی‌ها و پیوست‌ها» خالی است؛ اگر وابستگی ندارد، همین را بنویسید.');
  }

  return { total: Math.round(total), missing };
}
