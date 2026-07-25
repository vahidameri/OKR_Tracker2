// امتیاز آمادگی سند از ۱۰۰ + فهرست کمبودها برای جعبهٔ «برای بهترشدن سند»
// توجه: این محاسبه فعلاً فقط بر اساس تکمیل‌بودن فیلدهاست و کیفیت محتوا را نمی‌سنجد.

import type { FormState } from '../state';
import { criteriaLines, isBug } from '../state';

export interface ScoreResult {
  total: number;
  missing: string[];
}

const MIN_PROBLEM_CHARS = 40;
const MIN_CRITERIA_CHARS = 60;

export function computeScore(state: FormState): ScoreResult {
  let total = 0;
  const missing: string[] = [];

  // شفافیت صورت‌مسئله — ۲۵ امتیاز
  const problemLen = state.problem.trim().length;
  if (problemLen >= MIN_PROBLEM_CHARS) {
    total += 12;
  } else if (problemLen > 0) {
    total += 6;
    missing.push('صورت‌مسئله را کمی کامل‌تر بنویسید (حدود ۴۰ کاراکتر یا بیشتر).');
  } else {
    missing.push('صورت‌مسئله نوشته نشده است.');
  }
  if (state.currentState.trim()) total += 6;
  else missing.push('«وضعیت فعلی» خالی است؛ در صورت امکان با شاهد کمی بنویسید.');
  if (state.desiredState.trim()) total += 7;
  else missing.push('«وضعیت مطلوب» خالی است.');

  // معیارهای پذیرش — ۲۵ امتیاز (دو معیار یا بیشتر با شرح کافی = کامل)
  const lines = criteriaLines(state.criteria);
  const criteriaLen = state.criteria.trim().length;
  if (lines.length >= 2 && criteriaLen >= MIN_CRITERIA_CHARS) {
    total += 25;
  } else if (lines.length >= 1) {
    total += 13;
    missing.push('دست‌کم دو معیار پذیرش بنویسید، هر کدام در یک خط جدا.');
  } else {
    missing.push('هیچ معیار پذیرشی نوشته نشده است.');
  }

  // ارزش کسب‌وکاری — ۲۰ امتیاز
  if (state.businessValue.trim()) total += 20;
  else missing.push('«ارزش کسب‌وکاری» خالی است؛ بنویسید اگر انجام نشود چه از دست می‌رود.');

  // خارج از دامنه — ۱۵ امتیاز (دو مورد)
  const scopeCount =
    (state.outOfScope1.trim() ? 1 : 0) + (state.outOfScope2.trim() ? 1 : 0);
  if (scopeCount === 2) total += 15;
  else if (scopeCount === 1) {
    total += 8;
    missing.push('مورد دوم «خارج از دامنه» را هم مشخص کنید.');
  } else {
    missing.push('«خارج از دامنه» مشخص نشده است (دو مورد).');
  }

  // اطلاعات فنی / وابستگی — ۱۵ امتیاز
  if (isBug(state)) {
    if (state.bugEnv.trim()) total += 5;
    else missing.push('«محیط، نسخه و دستگاه» باگ را مشخص کنید.');
    if (state.bugObserved.trim()) total += 5;
    else missing.push('«نتیجهٔ مشاهده‌شده» باگ خالی است.');
    if (state.bugExpected.trim()) total += 5;
    else missing.push('«نتیجهٔ مورد انتظار» باگ خالی است.');
  } else if (state.dependencies.trim()) {
    total += 15;
  } else {
    missing.push('«وابستگی‌ها و پیوست‌ها» خالی است؛ اگر وابستگی ندارد، همین را بنویسید.');
  }

  return { total: Math.round(total), missing };
}
