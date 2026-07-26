// state کل ویزارد — فقط در حافظهٔ session؛ هیچ ذخیره‌سازی یا ارسالی وجود ندارد

import type { Product } from './data/people';
import { OTHER_PRODUCT, findPerson } from './data/people';

/** شش دستهٔ درخواست — هر درخواست دقیقاً در یکی از اینها جا می‌گیرد */
export type RequestType =
  | 'feature'
  | 'improvement'
  | 'bug'
  | 'tech'
  | 'data'
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
export type ListKey = 'outOfScope' | 'successMetrics';

export interface FormState {
  docType: DocType | null;
  personId: string | null;
  /** نام و سمت دستی — فقط وقتی personId برابر OTHER_PERSON_ID است */
  customName: string;
  customRole: string;
  /** مسیر بررسی — اول از همه پرسیده می‌شود و ادامهٔ فرم را فیلتر می‌کند */
  fastTrack: [YesNo, YesNo, YesNo, YesNo];
  /** نوع درخواست — تک‌انتخابی */
  requestType: RequestType | null;
  /** توضیح دستی نوع درخواست — فقط وقتی requestType برابر «سایر» است */
  customRequestType: string;
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
  outOfScope: string[];
  successMetrics: string[];
  /** محیط، نسخه و دستگاه — فقط برای باگ */
  bugEnv: string;
  /** شدت و دامنهٔ اثر — فقط برای باگ */
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
  requestType: null,
  customRequestType: '',
  title: '',
  product: null,
  customProduct: '',
  productTouched: false,
  problem: '',
  currentState: '',
  desiredState: '',
  businessValue: '',
  // «خارج از دامنه» و «سنجهٔ موفقیت» دست‌کم دو مورد دارند
  outOfScope: ['', ''],
  successMetrics: ['', ''],
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
  | { type: 'selectRequestType'; value: RequestType }
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
    case 'selectRequestType':
      return { ...state, requestType: action.value };
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
  return state.requestType === 'bug';
}

/** آیا نوع درخواست همان گزینهٔ «سایر» است؟ */
export function isOtherRequestType(state: FormState): boolean {
  return state.requestType === 'other';
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
  | 'outOfScope'
  | 'successMetrics'
  | 'dependencies';

/**
 * جدول الزامات: هر نوع درخواست فقط اطلاعاتی را می‌خواهد که واقعاً به آن نیاز
 * دارد. required = باید پر شود، optional = نمایش داده می‌شود ولی اجباری نیست،
 * هرچه در هیچ‌کدام نباشد غیرفعال می‌شود.
 *
 * «صورت‌مسئله» در هیچ‌کدام نیست چون همیشه و برای همهٔ نوع‌ها الزامی است.
 */
const TYPE_FIELDS: Record<
  RequestType,
  { required: GatedField[]; optional: GatedField[] }
> = {
  feature: {
    required: ['desiredState', 'businessValue', 'outOfScope', 'successMetrics'],
    optional: ['currentState', 'dependencies'],
  },
  improvement: {
    required: ['currentState', 'desiredState', 'businessValue', 'successMetrics'],
    optional: ['outOfScope', 'dependencies'],
  },
  // ارزش کسب‌وکاری برای باگ غیرفعال است؛ به‌جایش «شدت و دامنهٔ اثر» پرسیده می‌شود
  bug: {
    required: ['currentState', 'desiredState'],
    optional: ['dependencies'],
  },
  tech: {
    required: ['currentState', 'desiredState', 'businessValue'],
    optional: ['outOfScope', 'successMetrics', 'dependencies'],
  },
  data: {
    required: ['desiredState', 'businessValue'],
    optional: ['currentState', 'outOfScope', 'dependencies'],
  },
  other: {
    required: [],
    optional: ['currentState', 'desiredState', 'businessValue', 'dependencies'],
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
  if (!state.requestType) return true;
  const fields = TYPE_FIELDS[state.requestType];
  return fields.required.includes(field) || fields.optional.includes(field);
}

/** آیا پرکردن این فیلد الزامی است؟ (فقط وقتی فعال هم باشد) */
export function fieldRequired(state: FormState, field: GatedField): boolean {
  if (!fieldEnabled(state, field)) return false;
  if (!state.requestType) return true;
  return TYPE_FIELDS[state.requestType].required.includes(field);
}

/** توضیح اینکه چرا این فیلد غیرفعال شده است */
export function disabledReason(state: FormState, field: GatedField): string {
  if (isFastTrack(state) && FAST_TRACK_SKIPPED.includes(field)) {
    return 'چون این درخواست در مسیر سریع قرار گرفته، این بخش لازم نیست.';
  }
  if (field === 'businessValue' && isBug(state)) {
    return 'برای باگ لازم نیست؛ به‌جایش «شدت و دامنهٔ اثر» در مرحلهٔ اولویت پرسیده می‌شود.';
  }
  const label = requestTypeName(state.requestType);
  return `برای نوع درخواست «${label}» این بخش لازم نیست.`;
}

/**
 * برچسب کوچک کنار عنوان فیلد غیرفعال — می‌گوید *چرا* غیرفعال است، نه فقط
 * اینکه لازم نیست.
 */
export function disabledBadge(state: FormState, field: GatedField): string {
  if (isFastTrack(state) && FAST_TRACK_SKIPPED.includes(field)) {
    return 'در مسیر سریع لازم نیست';
  }
  return `برای «${requestTypeName(state.requestType)}» لازم نیست`;
}

/** آیا مرحلهٔ دامنه اصلاً فیلد فعالی دارد؟ */
export function scopeStepNeeded(state: FormState): boolean {
  return fieldEnabled(state, 'outOfScope') || fieldEnabled(state, 'successMetrics');
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
  {
    value: 'feature',
    label: 'قابلیت جدید',
    hint: 'نیازی که امروز هیچ راهکاری برایش وجود ندارد',
  },
  {
    value: 'improvement',
    label: 'بهبود و تغییر',
    hint: 'راهکار موجود کار می‌کند، اما باید بهتر یا متفاوت شود',
  },
  {
    value: 'bug',
    label: 'رفع اشکال (باگ)',
    hint: 'رفتار فعلی با رفتار مورد انتظار مغایرت دارد',
  },
  {
    value: 'tech',
    label: 'کار فنی و زیرساختی',
    hint: 'تغییر در زیرساخت، معماری یا بدهی فنی',
  },
  {
    value: 'data',
    label: 'داده و گزارش',
    hint: 'دسترسی، سنجش یا تحلیل داده، برای استفادهٔ داخلی',
  },
  {
    value: 'other',
    label: 'سایر',
    hint: 'خارج از پنج دستهٔ بالا؛ نیازمند توضیح در متن درخواست',
  },
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

/** نام کوتاه یک نوع درخواست */
export function requestTypeName(type: RequestType | null): string {
  return REQUEST_TYPES.find((r) => r.value === type)?.label ?? '—';
}

/** نوع درخواست برای نمایش و سند — با «سایر» توضیح خودِ کاربر هم می‌آید */
export function requestTypeLabel(state: FormState): string {
  if (!state.requestType) return '—';
  const name = requestTypeName(state.requestType);
  if (isOtherRequestType(state) && state.customRequestType.trim()) {
    return `${name} — ${state.customRequestType.trim()}`;
  }
  return name;
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

export type StepId = 'request' | 'problem' | 'bug' | 'scope' | 'priority' | 'review';

/**
 * فهرست مراحل قابل‌نمایش. مرحلهٔ باگ فقط برای درخواست باگ می‌آید و مرحلهٔ
 * دامنه فقط وقتی دست‌کم یکی از فیلدهایش فعال باشد.
 */
export function visibleSteps(state: FormState): StepId[] {
  const steps: StepId[] = ['request', 'problem'];
  if (isBug(state)) steps.push('bug');
  if (scopeStepNeeded(state)) steps.push('scope');
  steps.push('priority', 'review');
  return steps;
}
