// امتیاز آمادگی سند از ۱۰۰ + فهرست کمبودها برای جعبهٔ «برای بهترشدن سند»
// توجه: این محاسبه فعلاً فقط بر اساس تکمیل‌بودن فیلدهاست و کیفیت محتوا را نمی‌سنجد.

import type { FormState } from '../state';
import { fieldEnabled, filledItems, isBug } from '../state';

export interface ScoreResult {
  total: number;
  missing: string[];
}

const MIN_PROBLEM_CHARS = 40;

interface Component {
  weight: number;
  /** میزان تکمیل، بین ۰ تا ۱ */
  ratio: number;
  missing?: string;
}

/**
 * امتیاز از مجموع محورهای *فعال* نرمال می‌شود. اینطوری وقتی نوع درخواست یا
 * مسیر سریع بخشی از سؤال‌ها را حذف می‌کند، درخواست بابت چیزی که از او
 * پرسیده نشده جریمه نمی‌شود و همچنان می‌تواند به ۱۰۰ برسد.
 */
export function computeScore(state: FormState): ScoreResult {
  const parts: Component[] = [];

  // صورت‌مسئله
  const problemLen = state.problem.trim().length;
  parts.push({
    weight: 12,
    ratio: problemLen >= MIN_PROBLEM_CHARS ? 1 : problemLen > 0 ? 0.5 : 0,
    missing:
      problemLen === 0
        ? 'صورت‌مسئله نوشته نشده است.'
        : problemLen < MIN_PROBLEM_CHARS
          ? 'صورت‌مسئله را کمی کامل‌تر بنویسید (حدود ۴۰ کاراکتر یا بیشتر).'
          : undefined,
  });

  if (fieldEnabled(state, 'currentState')) {
    parts.push({
      weight: 6,
      ratio: state.currentState.trim() ? 1 : 0,
      missing: '«وضعیت فعلی» خالی است؛ در صورت امکان با شاهد کمی بنویسید.',
    });
  }

  if (fieldEnabled(state, 'desiredState')) {
    parts.push({
      weight: 7,
      ratio: state.desiredState.trim() ? 1 : 0,
      missing: '«وضعیت مطلوب» خالی است.',
    });
  }

  if (fieldEnabled(state, 'criteria')) {
    const n = filledItems(state.criteria).length;
    parts.push({
      weight: 25,
      ratio: n >= 2 ? 1 : n === 1 ? 0.5 : 0,
      missing:
        n === 0
          ? 'هیچ معیار پذیرشی نوشته نشده است.'
          : n === 1
            ? 'دست‌کم یک معیار پذیرش دیگر اضافه کنید.'
            : undefined,
    });
  }

  if (fieldEnabled(state, 'businessValue')) {
    parts.push({
      weight: 20,
      ratio: state.businessValue.trim() ? 1 : 0,
      missing: '«ارزش کسب‌وکاری» خالی است؛ بنویسید اگر انجام نشود چه از دست می‌رود.',
    });
  }

  if (fieldEnabled(state, 'outOfScope')) {
    const n = filledItems(state.outOfScope).length;
    parts.push({
      weight: 15,
      ratio: n >= 2 ? 1 : n === 1 ? 0.5 : 0,
      missing:
        n === 0
          ? '«خارج از دامنه» مشخص نشده است.'
          : n === 1
            ? 'مورد دوم «خارج از دامنه» را هم مشخص کنید.'
            : undefined,
    });
  }

  // اطلاعات فنی: برای باگ سه‌قسمتی، در غیر این صورت وابستگی‌ها
  if (isBug(state)) {
    const bug: [boolean, string][] = [
      [!!state.bugEnv.trim(), '«محیط، نسخه و دستگاه» باگ را مشخص کنید.'],
      [!!state.bugObserved.trim(), '«نتیجهٔ مشاهده‌شده» باگ خالی است.'],
      [!!state.bugExpected.trim(), '«نتیجهٔ مورد انتظار» باگ خالی است.'],
    ];
    for (const [ok, msg] of bug) {
      parts.push({ weight: 5, ratio: ok ? 1 : 0, missing: msg });
    }
  } else if (fieldEnabled(state, 'dependencies')) {
    parts.push({
      weight: 15,
      ratio: state.dependencies.trim() ? 1 : 0,
      missing: '«وابستگی‌ها و پیوست‌ها» خالی است؛ اگر وابستگی ندارد، همین را بنویسید.',
    });
  }

  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  const earned = parts.reduce((sum, p) => sum + p.weight * p.ratio, 0);
  const missing = parts
    .filter((p) => p.ratio < 1 && p.missing)
    .map((p) => p.missing as string);

  return {
    total: totalWeight === 0 ? 0 : Math.round((earned / totalWeight) * 100),
    missing,
  };
}
