// state کل ویزارد — فقط در حافظهٔ session؛ هیچ ذخیره‌سازی یا ارسالی وجود ندارد

import type { Product } from './data/people';
import { findPerson } from './data/people';

export type RequestType =
  | 'feature'
  | 'improvement'
  | 'bug'
  | 'tech'
  | 'data'
  | 'feasibility'
  | 'other';

export type Severity = 'high' | 'medium' | 'low';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
/** پاسخ پرسش‌های مسیر سریع: «بله» یا «خیر یا نمی‌دانم» */
export type YesNo = 'yes' | 'no' | null;

export interface Criterion {
  id: number;
  given: string; // با آنکه…
  when: string; // وقتی…
  then: string; // آنگاه…
}

export interface FormState {
  personId: string | null;
  requestType: RequestType | null;
  title: string;
  product: Product | null;
  /** آیا کاربر محصول را دستی تغییر داده؟ (برای پیش‌انتخاب خودکار) */
  productTouched: boolean;
  problem: string;
  currentState: string;
  desiredState: string;
  businessValue: string;
  criteria: Criterion[];
  outOfScope1: string;
  outOfScope2: string;
  successMetric: string;
  bugSteps: string;
  bugObserved: string;
  bugExpected: string;
  bugEnv: string;
  bugSeverity: Severity | null;
  fastTrack: [YesNo, YesNo, YesNo, YesNo];
  priority: Priority | null;
  neededDate: string;
  dependencies: string;
}

let nextCriterionId = 3;

export const initialState: FormState = {
  personId: null,
  requestType: null,
  title: '',
  product: null,
  productTouched: false,
  problem: '',
  currentState: '',
  desiredState: '',
  businessValue: '',
  // دو کارت خالی پیش‌فرض
  criteria: [
    { id: 1, given: '', when: '', then: '' },
    { id: 2, given: '', when: '', then: '' },
  ],
  outOfScope1: '',
  outOfScope2: '',
  successMetric: '',
  bugSteps: '',
  bugObserved: '',
  bugExpected: '',
  bugEnv: '',
  bugSeverity: null,
  fastTrack: [null, null, null, null],
  priority: null,
  neededDate: '',
  dependencies: '',
};

export type Action =
  | { type: 'patch'; patch: Partial<FormState> }
  | { type: 'selectPerson'; id: string }
  | { type: 'selectProduct'; product: Product }
  | { type: 'setFastTrack'; index: number; value: YesNo }
  | { type: 'addCriterion' }
  | { type: 'removeCriterion'; id: number }
  | {
      type: 'updateCriterion';
      id: number;
      field: 'given' | 'when' | 'then';
      value: string;
    };

export function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'selectPerson': {
      const person = findPerson(action.id);
      // اگر کاربر هنوز محصول را دستی انتخاب نکرده، محصولِ پیش‌فرضِ شخص پیش‌انتخاب شود
      const product =
        !state.productTouched && person?.defaultProduct
          ? person.defaultProduct
          : state.product;
      return { ...state, personId: action.id, product };
    }
    case 'selectProduct':
      return { ...state, product: action.product, productTouched: true };
    case 'setFastTrack': {
      const fastTrack = [...state.fastTrack] as FormState['fastTrack'];
      fastTrack[action.index] = action.value;
      return { ...state, fastTrack };
    }
    case 'addCriterion':
      return {
        ...state,
        criteria: [
          ...state.criteria,
          { id: nextCriterionId++, given: '', when: '', then: '' },
        ],
      };
    case 'removeCriterion':
      return {
        ...state,
        criteria: state.criteria.filter((c) => c.id !== action.id),
      };
    case 'updateCriterion':
      return {
        ...state,
        criteria: state.criteria.map((c) =>
          c.id === action.id ? { ...c, [action.field]: action.value } : c,
        ),
      };
  }
}

/** آیا هر سه بخش معیار پر شده است؟ */
export function isCriterionComplete(c: Criterion): boolean {
  return !!(c.given.trim() && c.when.trim() && c.then.trim());
}

/** جملهٔ کامل معیار پذیرش */
export function criterionSentence(c: Criterion): string {
  return `با آنکه ${c.given.trim()}، وقتی ${c.when.trim()}، آنگاه ${c.then.trim()}.`;
}

/** آیا درخواست واجد شرایط مسیر سریع است؟ (هر چهار پاسخ «بله») */
export function isFastTrack(state: FormState): boolean {
  return state.fastTrack.every((a) => a === 'yes');
}

// ---------- برچسب‌های ثابت UI و سند ----------

export const REQUEST_TYPES: {
  value: RequestType;
  label: string;
  hint: string;
}[] = [
  { value: 'feature', label: 'قابلیت جدید', hint: 'چیزی که امروز وجود ندارد' },
  { value: 'improvement', label: 'بهبود', hint: 'هست، اما باید بهتر شود' },
  { value: 'bug', label: 'باگ', hint: 'هست، اما درست کار نمی‌کند' },
  { value: 'tech', label: 'وظیفهٔ فنی', hint: 'زیرساخت یا بدهی فنی' },
  { value: 'data', label: 'داده و گزارش', hint: 'استخراج داده یا داشبورد' },
  { value: 'feasibility', label: 'امکان‌سنجی', hint: 'هنوز نمی‌دانیم شدنی است' },
  { value: 'other', label: 'سایر', hint: 'مدیر برنامه دسته‌بندی می‌کند' },
];

export const SEVERITIES: { value: Severity; label: string; hint: string }[] = [
  { value: 'high', label: 'بالا', hint: 'مسیر اصلی مختل و بدون راه دور زدن' },
  { value: 'medium', label: 'متوسط', hint: 'راه جایگزین هست' },
  { value: 'low', label: 'پایین', hint: 'ظاهری یا موردی' },
];

export const PRIORITIES: { value: Priority; label: string; hint: string }[] = [
  { value: 'critical', label: 'بحرانی', hint: 'مانع جدی کار جاری' },
  { value: 'high', label: 'بالا', hint: 'اثر مستقیم بر OKR' },
  { value: 'medium', label: 'متوسط', hint: 'بدون قید زمانی سخت' },
  { value: 'low', label: 'پایین', hint: 'هر زمان ظرفیت بود' },
];

export const FAST_TRACK_QUESTIONS = [
  'کل کار احتمالاً کمتر از ۴ ساعت است؟',
  'به تیم دیگری وابسته نیست؟',
  'تغییری در معماری، پایگاه داده یا تجربهٔ کاربری ایجاد نمی‌کند؟',
  'به تصمیم جدید محصولی نیاز ندارد؟',
];

export function requestTypeLabel(t: RequestType | null): string {
  return REQUEST_TYPES.find((r) => r.value === t)?.label ?? '—';
}

export function severityLabel(s: Severity | null): string {
  const item = SEVERITIES.find((x) => x.value === s);
  return item ? `${item.label} — ${item.hint}` : '—';
}

export function priorityLabel(p: Priority | null): string {
  const item = PRIORITIES.find((x) => x.value === p);
  return item ? `${item.label} — ${item.hint}` : '—';
}

// ---------- مراحل ویزارد (پویا بر اساس نوع درخواست) ----------

export type StepId =
  | 'person'
  | 'type'
  | 'problem'
  | 'criteria'
  | 'bug'
  | 'schedule'
  | 'review';

/** فهرست مراحل قابل‌نمایش؛ مرحلهٔ باگ فقط وقتی نوع = باگ */
export function visibleSteps(state: FormState): StepId[] {
  const steps: StepId[] = ['person', 'type', 'problem', 'criteria'];
  if (state.requestType === 'bug') steps.push('bug');
  steps.push('schedule', 'review');
  return steps;
}
