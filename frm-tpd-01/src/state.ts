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
/** پاسخ گزاره‌های مسیر بررسی: «بله» یا «خیر یا نمی‌دانم» */
export type YesNo = 'yes' | 'no' | null;

/** نوع سندی که تولید می‌شود */
export type DocType = 'tid' | 'prd';

export const DOC_TYPES: {
  value: DocType;
  label: string;
  english: string;
  hint: string;
  available: boolean;
}[] = [
  {
    value: 'tid',
    label: 'سند اطلاعات تسک',
    english: 'Task Information Document — TID',
    hint: 'برای یک کار مشخص و قابل تحویل: قابلیت، بهبود، باگ یا وظیفهٔ فنی',
    available: true,
  },
  {
    value: 'prd',
    label: 'سند نیازمندی محصول',
    english: 'Product Requirements Document — PRD',
    hint: 'برای تعریف یک محصول یا قابلیت بزرگ با چند تسک — به‌زودی',
    available: false,
  },
];

export function docTypeLabel(t: DocType | null): string {
  const item = DOC_TYPES.find((d) => d.value === t);
  return item ? `${item.label} (${item.english.split('—')[1].trim()})` : '—';
}

/** شناسهٔ ویژه برای درخواست‌دهنده‌ای که در فهرست نیست */
export const OTHER_PERSON_ID = '__other__';

/** کلیدهای فهرست‌های تکرارشونده */
export type ListKey = 'criteria' | 'outOfScope' | 'successMetrics';

export interface FormState {
  docType: DocType | null;
  personId: string | null;
  /** نام و سمت دستی — فقط وقتی personId برابر OTHER_PERSON_ID است */
  customName: string;
  customRole: string;
  /** مسیر بررسی — اول از همه پرسیده می‌شود و ادامهٔ فرم را فیلتر می‌کند */
  fastTrack: [YesNo, YesNo, YesNo, YesNo];
  requestTypes: RequestType[];
  title: string;
  product: Product | null;
  /** آیا کاربر محصول را دستی تغییر داده؟ (برای پیش‌انتخاب خودکار) */
  productTouched: boolean;
  problem: string;
  currentState: string;
  desiredState: string;
  businessValue: string;
  criteria: string[];
  outOfScope: string[];
  successMetrics: string[];
  bugSteps: string;
  bugObserved: string;
  bugExpected: string;
  bugEnv: string;
  bugSeverity: Severity | null;
  priority: Priority | null;
  neededDate: string;
  dependencies: string;
}

export const initialState: FormState = {
  docType: null,
  personId: null,
  customName: '',
  customRole: '',
  fastTrack: [null, null, null, null],
  requestTypes: [],
  title: '',
  product: null,
  productTouched: false,
  problem: '',
  currentState: '',
  desiredState: '',
  businessValue: '',
  criteria: [''],
  outOfScope: [''],
  successMetrics: [''],
  bugSteps: '',
  bugObserved: '',
  bugExpected: '',
  bugEnv: '',
  bugSeverity: null,
  priority: null,
  neededDate: '',
  dependencies: '',
};

export type Action =
  | { type: 'patch'; patch: Partial<FormState> }
  | { type: 'selectPerson'; id: string }
  | { type: 'selectProduct'; product: Product }
  | { type: 'toggleRequestType'; value: RequestType }
  | { type: 'setFastTrack'; index: number; value: YesNo }
  | { type: 'listAdd'; key: ListKey }
  | { type: 'listRemove'; key: ListKey; index: number }
  | { type: 'listChange'; key: ListKey; index: number; value: string };

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
    case 'listAdd':
      return { ...state, [action.key]: [...state[action.key], ''] };
    case 'listRemove':
      return {
        ...state,
        [action.key]: state[action.key].filter((_, i) => i !== action.index),
      };
    case 'listChange':
      return {
        ...state,
        [action.key]: state[action.key].map((v, i) =>
          i === action.index ? action.value : v,
        ),
      };
  }
}

/** آیا این درخواست از نوع باگ است؟ */
export function isBug(state: FormState): boolean {
  return state.requestTypes.includes('bug');
}

/** آیا درخواست واجد شرایط مسیر سریع است؟ (هر چهار پاسخ «بله») */
export function isFastTrack(state: FormState): boolean {
  return state.fastTrack.every((a) => a === 'yes');
}

/** آیا هر چهار گزارهٔ مسیر بررسی پاسخ داده شده است؟ */
export function triageAnswered(state: FormState): boolean {
  return state.fastTrack.every((a) => a !== null);
}

/**
 * فیلد‌هایی که برای درخواست‌های مسیر سریع لازم نیستند و غیرفعال می‌شوند.
 * کار کمتر از ۴ ساعت بدون وابستگی، به تحلیل ارزش و مرزبندی دامنه نیاز ندارد.
 */
export const FAST_TRACK_SKIPPED = [
  'businessValue',
  'outOfScope',
  'successMetrics',
  'dependencies',
] as const;

export type SkippableField = (typeof FAST_TRACK_SKIPPED)[number];

export function isSkipped(state: FormState, field: SkippableField): boolean {
  return isFastTrack(state) && FAST_TRACK_SKIPPED.includes(field);
}

/** موارد غیرخالی یک فهرست تکرارشونده */
export function filledItems(items: string[]): string[] {
  return items.map((i) => i.trim()).filter(Boolean);
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

/** گزاره‌های مسیر بررسی — همه مثبت نوشته شده‌اند تا «بله» همیشه یک معنا بدهد */
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
  | 'start'
  | 'request'
  | 'problem'
  | 'criteria'
  | 'bug'
  | 'priority'
  | 'review';

/** فهرست مراحل قابل‌نمایش؛ مرحلهٔ باگ فقط وقتی «باگ» بین نوع‌ها باشد */
export function visibleSteps(state: FormState): StepId[] {
  const steps: StepId[] = ['start', 'request', 'problem', 'criteria'];
  if (isBug(state)) steps.push('bug');
  steps.push('priority', 'review');
  return steps;
}
