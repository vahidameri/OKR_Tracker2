// امتیاز آمادگی سند از ۱۰۰ + فهرست کمبودها برای جعبهٔ «برای بهترشدن سند»
// طول پاسخ‌ها اینجا دخیل است: پاسخ کوتاه نیمی از امتیاز محور خودش را می‌گیرد.

import type { FormState } from '../state';
import { fieldEnabled, isBug } from '../state';
import { GOOD_LENGTH, filled, len, lengthRatio, listRatio } from './limits';

export interface ScoreResult {
  total: number;
  missing: string[];
}

/**
 * حد پایین امتیاز برای گرفتن سند. زیر این عدد، سند آن‌قدر ناقص است که بررسی‌اش
 * وقت هر دو طرف را می‌گیرد، پس دکمهٔ دریافت PDF قفل می‌شود.
 */
export const MIN_PRINT_SCORE = 70;

/** آیا با این امتیاز اجازهٔ دریافت سند هست؟ */
export function canPrint(total: number): boolean {
  return total >= MIN_PRINT_SCORE;
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
    weight: 22,
    ratio: lengthRatio(state.problem, GOOD_LENGTH.problem),
    missing: textGap('صورت‌مسئله', state.problem, GOOD_LENGTH.problem),
  });

  if (fieldEnabled(state, 'currentState')) {
    parts.push({
      weight: 14,
      ratio: lengthRatio(state.currentState, GOOD_LENGTH.currentState),
      missing: textGap('وضعیت فعلی', state.currentState, GOOD_LENGTH.currentState),
    });
  }

  if (fieldEnabled(state, 'desiredState')) {
    parts.push({
      weight: 18,
      ratio: lengthRatio(state.desiredState, GOOD_LENGTH.desiredState),
      missing: textGap('وضعیت مطلوب', state.desiredState, GOOD_LENGTH.desiredState),
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

  // برخلاف «خارج از دامنه»، یک سنجهٔ کامل امتیاز کامل این محور را می‌گیرد
  if (fieldEnabled(state, 'successMetrics')) {
    const items = filled(state.successMetrics);
    const best = items.reduce((max, i) => Math.max(max, i.length), 0);
    parts.push({
      weight: 14,
      ratio: best === 0 ? 0 : best >= GOOD_LENGTH.metric ? 1 : 0.5,
      missing:
        items.length === 0
          ? '«سنجهٔ موفقیت» خالی است.'
          : 'سنجهٔ موفقیت خیلی کوتاه است؛ کمی کامل‌ترش کنید.',
    });
  }

  // برای باگ، محیط و نسخه همان‌قدر مهم است که برای بقیه «ارزش کسب‌وکاری»
  if (isBug(state)) {
    parts.push({
      weight: 14,
      ratio: lengthRatio(state.bugEnv, GOOD_LENGTH.bugEnv),
      missing: textGap('محیط، نسخه و دستگاه', state.bugEnv, GOOD_LENGTH.bugEnv),
    });
  }

  if (fieldEnabled(state, 'dependencies')) {
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
