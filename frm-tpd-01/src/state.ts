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
/** پاسخ گزاره‌های مسیر سریع: «بله» یا «خیر یا نمی‌دانم» */
export type YesNo = 'yes' | 'no' | null;

/** شناسهٔ ویژه برای درخواست‌دهنده‌ای که در فهرست نیست */
export const OTHER_PERSON_ID = '__other__';

export interface FormState {
  personId: string | null;
  /** نام و سمت دستی — فقط وقتی personId برابر OTHER_PERSON_ID است */
  customName: string;
  customRole: string;
  /** نوع درخواست چندانتخابی است */
  requestTypes: RequestType[];
  title: string;
  product: Product | null;
  /** آیا کاربر محصول را دستی تغییر داده؟ (برای پیش‌انتخاب خودکار) */
  productTouched: boolean;
  problem: string;
  currentState: string;
  desiredState: string;
  businessValue: string;
  /** معیارهای پذیرش به‌صورت متن آزاد، هر معیار در یک خط */
  criteria: string;
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

export const initialState: FormState = {
  personId: null,
  customName: '',
  customRole: '',
  requestTypes: [],
  title: '',
  product: null,
  productTouched: false,
  problem: '',
  currentState: '',
  desiredState: '',
  businessValue: '',
  criteria: '',
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
  | { type: 'toggleRequestType'; value: RequestType }
  | { type: 'setFastTrack'; index: number; value: YesNo };

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
    case 'toggleRequestType': {
      const has = state.requestTypes.includes(action.value);
      return {
        ...state,
        requestTypes: has
          ? state.requestTypes.filter((t) => t !== action.value)
          : [...state.requestTypes, action.value],
      };
    }
    case 'setFastTrack': {
      const fastTrack = [...state.fastTrack] as FormState['fastTrack'];
      fastTrack[action.index] = action.value;
      return { ...state, fastTrack };
    }
  }
}

/** آیا این درخواست از نوع باگ است؟ */
export function isBug(state: FormState): boolean {
  return state.requestTypes.includes('bug');
}

/** خطوط غیرخالی معیارهای پذیرش */
export function criteriaLines(criteria: string): string[] {
  return criteria
    .split('\n')
    .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);
}

/** آیا درخواست واجد شرایط مسیر سریع است؟ (هر چهار پاسخ «بله») */
export function isFastTrack(state: FormState): boolean {
  return state.fastTrack.every((a) => a === 'yes');
}

/** نام و سمت درخواست‌دهنده، چه از فهرست چه دستی */
export function requesterInfo(state: FormState): { name: string; role: string } | null {
  if (state.personId === OTHER_PERSON_ID) {
    if (!state.customName.trim()) return null;
    return { name: state.customName.trim(), role: state.customRole.trim() };
  }
  const person = findPerson(state.personId);
  return person ? { name: person.name, role: person.role } : null;
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
  { value: 'critical', label: 'بحرانی', hint: 'کار جاری متوقف شده و راه دور زدنی ندارد' },
  { value: 'high', label: 'بالا', hint: 'مستقیماً روی یکی از OKRهای فصل جاری اثر دارد' },
  { value: 'medium', label: 'متوسط', hint: 'لازم است، اما تاریخ الزام‌آور ندارد' },
  { value: 'low', label: 'پایین', hint: 'بهبود مطلوب؛ هر زمان ظرفیت آزاد شد' },
];

/** گزاره‌های مسیر سریع — همه مثبت نوشته شده‌اند تا «بله» همیشه یک معنا بدهد */
export const FAST_TRACK_QUESTIONS = [
  'برآورد شما از کل کار — تحلیل، پیاده‌سازی و تست — کمتر از ۴ ساعت است.',
  'انجام آن فقط به تیم فناوری و محصول نیاز دارد و منتظر تیم دیگری نمی‌ماند.',
  'معماری، ساختار پایگاه داده و جریان تجربهٔ کاربری را تغییر نمی‌دهد.',
  'تکلیف محصولی آن روشن است و به تصمیم جدیدی از مدیر محصول نیاز ندارد.',
];

export function requestTypesLabel(types: RequestType[]): string {
  if (types.length === 0) return '—';
  return types
    .map((t) => REQUEST_TYPES.find((r) => r.value === t)?.label ?? t)
    .join(' · ');
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

/** فهرست مراحل قابل‌نمایش؛ مرحلهٔ باگ فقط وقتی «باگ» بین نوع‌ها باشد */
export function visibleSteps(state: FormState): StepId[] {
  const steps: StepId[] = ['person', 'type', 'problem', 'criteria'];
  if (isBug(state)) steps.push('bug');
  steps.push('schedule', 'review');
  return steps;
}
