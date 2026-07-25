// امتیاز آمادگی سند از ۱۰۰ + فهرست کمبودها برای جعبهٔ «برای بهترشدن سند»
// طول پاسخ‌ها اینجا دخیل است: پاسخ کوتاه نیمی از امتیاز محور خودش را می‌گیرد.

import type { FormState } from '../state';
import { fieldEnabled, isBug } from '../state';
import { GOOD_LENGTH, filled, len, lengthRatio, listRatio } from './limits';

export interface ScoreResult {
  total: number;
  missing: string[];
}

interface Component {
  weight: number;
  /** میزان تکمیل، بین ۰ تا ۱ */
  ratio: number;
  missing?: string;
}

/** پیام کمبود برای یک فیلد متنی */
function textGap(label: string, value: string, good: number): string | undefined {
  const n = len(value);
  if (n === 0) return `«${label}» خالی است.`;
  if (n < good) return `«${label}» خیلی کوتاه است؛ کمی کامل‌ترش کنید.`;
  return undefined;
}

/**
 * امتیاز از مجموع محورهای *فعال* نرمال می‌شود. اینطوری وقتی نوع درخواست یا
 * مسیر سریع بخشی از سؤال‌ها را حذف می‌کند، درخواست بابت چیزی که از او
 * پرسیده نشده جریمه نمی‌شود و همچنان می‌تواند به ۱۰۰ برسد.
 */
export function computeScore(state: FormState): ScoreResult {
  const parts: Component[] = [];

  parts.push({
    weight: 8,
    ratio: lengthRatio(state.title, GOOD_LENGTH.title),
    missing: textGap('عنوان درخواست', state.title, GOOD_LENGTH.title),
  });

  parts.push({
    weight: 14,
    ratio: lengthRatio(state.problem, GOOD_LENGTH.problem),
    missing: textGap('صورت‌مسئله', state.problem, GOOD_LENGTH.problem),
  });

  if (fieldEnabled(state, 'currentState')) {
    parts.push({
      weight: 7,
      ratio: lengthRatio(state.currentState, GOOD_LENGTH.currentState),
      missing: textGap('وضعیت فعلی', state.currentState, GOOD_LENGTH.currentState),
    });
  }

  if (fieldEnabled(state, 'desiredState')) {
    parts.push({
      weight: 8,
      ratio: lengthRatio(state.desiredState, GOOD_LENGTH.desiredState),
      missing: textGap('وضعیت مطلوب', state.desiredState, GOOD_LENGTH.desiredState),
    });
  }

  if (fieldEnabled(state, 'criteria')) {
    const n = filled(state.criteria).length;
    parts.push({
      weight: 25,
      ratio: listRatio(state.criteria, GOOD_LENGTH.criterion),
      missing:
        n === 0
          ? 'هیچ معیار پذیرشی نوشته نشده است.'
          : listRatio(state.criteria, GOOD_LENGTH.criterion) < 1
            ? 'معیارهای پذیرش را کامل‌تر یا بیشتر کنید (دو معیار روشن).'
            : undefined,
    });
  }

  if (fieldEnabled(state, 'businessValue')) {
    parts.push({
      weight: 18,
      ratio: lengthRatio(state.businessValue, GOOD_LENGTH.businessValue),
      missing: textGap(
        'ارزش کسب‌وکاری',
        state.businessValue,
        GOOD_LENGTH.businessValue,
      ),
    });
  }

  if (fieldEnabled(state, 'outOfScope')) {
    const n = filled(state.outOfScope).length;
    parts.push({
      weight: 13,
      ratio: listRatio(state.outOfScope, GOOD_LENGTH.scopeItem),
      missing:
        n === 0
          ? '«خارج از دامنه» مشخص نشده است.'
          : listRatio(state.outOfScope, GOOD_LENGTH.scopeItem) < 1
            ? 'مورد دوم «خارج از دامنه» را هم مشخص کنید.'
            : undefined,
    });
  }

  if (fieldEnabled(state, 'successMetrics')) {
    parts.push({
      weight: 5,
      ratio: Math.min(1, filled(state.successMetrics).length),
      missing: '«سنجهٔ موفقیت» خالی است.',
    });
  }

  // اطلاعات فنی: برای باگ سه‌قسمتی، در غیر این صورت وابستگی‌ها
  if (isBug(state)) {
    const bug: [string, string, number][] = [
      ['محیط، نسخه و دستگاه', state.bugEnv, GOOD_LENGTH.bugEnv],
      ['نتیجهٔ مشاهده‌شده', state.bugObserved, GOOD_LENGTH.bugObserved],
      ['نتیجهٔ مورد انتظار', state.bugExpected, GOOD_LENGTH.bugExpected],
      ['مراحل بازتولید', state.bugSteps, GOOD_LENGTH.bugSteps],
    ];
    for (const [label, value, good] of bug) {
      parts.push({
        weight: 4,
        ratio: lengthRatio(value, good),
        missing: textGap(label, value, good),
      });
    }
  } else if (fieldEnabled(state, 'dependencies')) {
    parts.push({
      weight: 12,
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
