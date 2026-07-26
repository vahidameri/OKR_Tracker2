// state کل ویزارد — فقط در حافظهٔ session؛ هیچ ذخیره‌سازی یا ارسالی وجود ندارد

import type { Product } from './data/people';
import { OTHER_PRODUCT, findPerson } from './data/people';

/** شش دستهٔ درخواست — هر درخواستی در یکی (یا چند تای) از اینها جا می‌گیرد */
export type RequestType =
  | 'feature'
  | 'improvement'
  | 'bug'
  | 'tech'
  | 'data'
  | 'feasibility';

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
  /** نام محصول دستی — فقط وقتی product برابر «سایر» است */
  customProduct: string;
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
  customProduct: '',
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

/** فیلدهایی که بسته به نوع درخواست و مسیر بررسی، وضعیتشان فرق می‌کند */
export type GatedField =
  | 'currentState'
  | 'desiredState'
  | 'businessValue'
  | 'criteria'
  | 'outOfScope'
  | 'successMetrics'
  | 'dependencies';

/**
 * هر نوع درخواست فقط اطلاعاتی را می‌خواهد که واقعاً به آن نیاز دارد.
 * required = باید پر شود، optional = نمایش داده می‌شود ولی اجباری نیست،
 * هرچه در هیچ‌کدام نباشد غیرفعال می‌شود.
 */
const TYPE_FIELDS: Record<
  RequestType,
  { required: GatedField[]; optional: GatedField[] }
> = {
  feature: {
    required: ['currentState', 'desiredState', 'businessValue', 'criteria', 'outOfScope'],
    optional: ['successMetrics', 'dependencies'],
  },
  improvement: {
    required: ['currentState', 'desiredState', 'businessValue', 'criteria', 'outOfScope'],
    optional: ['successMetrics', 'dependencies'],
  },
  tech: {
    required: ['currentState', 'desiredState', 'businessValue', 'criteria', 'outOfScope'],
    optional: ['dependencies'],
  },
  // جزئیات باگ در مرحلهٔ اختصاصی خودش گرفته می‌شود
  bug: {
    required: ['currentState', 'desiredState', 'criteria'],
    optional: ['dependencies'],
  },
  // خروجی گزارش خودش سند پذیرش است؛ شرح وضعیت هم کمک‌کننده است نه الزامی
  data: {
    required: [],
    optional: ['currentState', 'desiredState', 'dependencies'],
  },
  // هنوز نمی‌دانیم شدنی است، پس معیار پذیرش و سنجه هنوز قابل تعریف نیست
  feasibility: {
    required: ['currentState', 'desiredState', 'businessValue', 'outOfScope'],
    optional: ['dependencies'],
  },
};

/** فیلدهایی که مسیر سریع آنها را غیرضروری می‌کند */
const FAST_TRACK_SKIPPED: GatedField[] = [
  'businessValue',
  'outOfScope',
  'successMetrics',
  'dependencies',
];

/** آیا این فیلد برای وضعیت فعلی فرم فعال است؟ */
export function fieldEnabled(state: FormState, field: GatedField): boolean {
  if (isFastTrack(state) && FAST_TRACK_SKIPPED.includes(field)) return false;
  if (state.requestTypes.length === 0) return true;
  return state.requestTypes.some(
    (t) =>
      TYPE_FIELDS[t].required.includes(field) ||
      TYPE_FIELDS[t].optional.includes(field),
  );
}

/** آیا پرکردن این فیلد الزامی است؟ (فقط وقتی فعال هم باشد) */
export function fieldRequired(state: FormState, field: GatedField): boolean {
  if (!fieldEnabled(state, field)) return false;
  if (state.requestTypes.length === 0) return true;
  return state.requestTypes.some((t) => TYPE_FIELDS[t].required.includes(field));
}

/** توضیح اینکه چرا این فیلد غیرفعال شده است */
export function disabledReason(state: FormState, field: GatedField): string {
  if (isFastTrack(state) && FAST_TRACK_SKIPPED.includes(field)) {
    return 'چون این درخواست در مسیر سریع قرار گرفته، این بخش لازم نیست.';
  }
  const labels = state.requestTypes
    .map((t) => REQUEST_TYPES.find((r) => r.value === t)?.label ?? t)
    .join(' و ');
  return `برای نوع درخواست «${labels}» این بخش لازم نیست.`;
}

/** آیا مرحلهٔ معیارها اصلاً فیلد فعالی دارد؟ */
export function criteriaStepNeeded(state: FormState): boolean {
  return (
    fieldEnabled(state, 'criteria') ||
    fieldEnabled(state, 'outOfScope') ||
    fieldEnabled(state, 'successMetrics')
  );
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

/** آیا محصول انتخاب‌شده همان گزینهٔ «سایر» است؟ */
export function isOtherProduct(state: FormState): boolean {
  return state.product === OTHER_PRODUCT;
}

/** نام محصول برای نمایش و سند — با «سایر» متنِ خودِ کاربر جایگزین می‌شود */
export function productLabel(state: FormState): string {
  if (!state.product) return '';
  if (isOtherProduct(state)) return state.customProduct.trim() || 'سایر';
  return state.product;
}

// ---------- صفحهٔ آغازین: فیلدها یکی‌یکی ظاهر می‌شوند ----------

/** عنوان درخواست پر شده است؟ */
export function titleDone(state: FormState): boolean {
  return state.title.trim().length > 0;
}

/** نام و سمت درخواست‌دهنده کامل است؟ */
export function requesterDone(state: FormState): boolean {
  if (!state.personId) return false;
  if (state.personId === OTHER_PERSON_ID) {
    return state.customName.trim().length > 0 && state.customRole.trim().length > 0;
  }
  return true;
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
  { value: 'tech', label: 'وظیفهٔ فنی', hint: 'زیرساخت، پایداری یا بدهی فنی' },
  { value: 'data', label: 'داده و گزارش', hint: 'استخراج داده، داشبورد یا گزارش' },
  { value: 'feasibility', label: 'امکان‌سنجی', hint: 'هنوز نمی‌دانیم شدنی است یا نه' },
];

export type Tone = 'critical' | 'high' | 'medium' | 'low';

export const SEVERITIES: {
  value: Severity;
  label: string;
  hint: string;
  tone: Tone;
}[] = [
  { value: 'high', label: 'بالا', hint: 'مسیر اصلی مختل و بدون راه دور زدن', tone: 'critical' },
  { value: 'medium', label: 'متوسط', hint: 'راه جایگزین هست', tone: 'medium' },
  { value: 'low', label: 'پایین', hint: 'ظاهری یا موردی', tone: 'low' },
];

export const PRIORITIES: {
  value: Priority;
  label: string;
  hint: string;
  tone: Tone;
}[] = [
  { value: 'critical', label: 'بحرانی', hint: 'کار جاری متوقف شده و راه دور زدنی ندارد', tone: 'critical' },
  { value: 'high', label: 'بالا', hint: 'مستقیماً روی یکی از OKRهای فصل جاری اثر دارد', tone: 'high' },
  { value: 'medium', label: 'متوسط', hint: 'لازم است، اما تاریخ الزام‌آور ندارد', tone: 'medium' },
  { value: 'low', label: 'پایین', hint: 'بهبود مطلوب؛ هر زمان ظرفیت آزاد شد', tone: 'low' },
];

/** گزاره‌های مسیر بررسی — همه مثبت نوشته شده‌اند تا «بله» همیشه یک معنا بدهد */
export const FAST_TRACK_QUESTIONS = [
  'تغییرِ چیزی است که هم‌اکنون وجود دارد؛ چیز تازه‌ای ساخته نمی‌شود.',
  'تنها به یک تیم نیاز دارد و به کار تیم دیگری وابسته نیست.',
  'معماری، ساختار پایگاه داده یا جریان تجربهٔ کاربری را تغییر نمی‌دهد.',
  'تکلیف محصولی آن روشن است و تصمیم تازه‌ای از مدیر محصول نمی‌خواهد.',
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
  | 'request'
  | 'problem'
  | 'criteria'
  | 'bug'
  | 'priority'
  | 'review';

/** فهرست مراحل قابل‌نمایش؛ مرحلهٔ باگ فقط وقتی «باگ» بین نوع‌ها باشد */
export function visibleSteps(state: FormState): StepId[] {
  const steps: StepId[] = ['request', 'problem'];
  if (criteriaStepNeeded(state)) steps.push('criteria');
  if (isBug(state)) steps.push('bug');
  steps.push('priority', 'review');
  return steps;
}
