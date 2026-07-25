// دادهٔ افراد و محصولات — برای ویرایش‌های بعدی فقط همین فایل را تغییر دهید

export const PRODUCTS = [
  'شاد مسنجر',
  'تماشا',
  'کلاسا',
  'پنل ادمین و CRM',
  'زیرساخت و سرویس‌های مشترک',
  'داشبوردها و گزارش‌ها',
  'سایر',
] as const;

export type Product = (typeof PRODUCTS)[number];

export interface Person {
  id: string;
  name: string;
  role: string;
  /** محصول پیش‌فرض برای پیش‌انتخاب در مرحلهٔ ۲ */
  defaultProduct?: Product;
}

export const PEOPLE: Person[] = [
  { id: 'vahid-ameri', name: 'وحید عامری', role: 'مدیر برنامه (PgM)' },
  { id: 'jalil-alizadeh', name: 'جلیل علیزاده', role: 'مدیر دپارتمان' },
  { id: 'kamran-ashrafi', name: 'کامران اشرفی', role: 'پروداکت دیزاینر' },
  { id: 'pardis-ghasemi', name: 'پردیس قاسمی', role: 'دیتا آنالیست', defaultProduct: 'داشبوردها و گزارش‌ها' },
  { id: 'ali-khoshnood', name: 'علی خوشنود', role: 'مدیر محصول عملیات', defaultProduct: 'پنل ادمین و CRM' },
  { id: 'morteza-safari', name: 'مرتضی صفری شاهی', role: 'تک‌لید شاد', defaultProduct: 'زیرساخت و سرویس‌های مشترک' },
  { id: 'misagh-riginejad', name: 'میثاق ریگی‌نژاد', role: 'مدیر محصول کلاسا', defaultProduct: 'کلاسا' },
  { id: 'alireza-yahyaei', name: 'علیرضا یحیایی', role: 'مدیر محصول تماشا، سرویس ورزشی و VOD', defaultProduct: 'تماشا' },
  { id: 'mona-khosronobari', name: 'مونا خسرونوبری', role: 'CRM', defaultProduct: 'پنل ادمین و CRM' },
  { id: 'zahra-nateghi', name: 'زهرا ناطقی', role: 'پایش', defaultProduct: 'پنل ادمین و CRM' },
  { id: 'ali-nasimi', name: 'علی نسیمی', role: 'مدیر محصول پیام‌رسان', defaultProduct: 'شاد مسنجر' },
  { id: 'ali-roudi', name: 'علی رودی', role: 'دولوپر' },
  { id: 'mohammad-sajadpour', name: 'محمد سجادپور', role: 'دولوپر' },
  { id: 'alireza-jafari', name: 'علیرضا جعفری', role: 'دولوپر' },
];

export function findPerson(id: string | null): Person | undefined {
  return PEOPLE.find((p) => p.id === id);
}

/** فهرست افراد مرتب‌شده بر اساس الفبای فارسی (ترتیب فایل بالا دست‌نخورده می‌ماند) */
const faCollator = new Intl.Collator('fa');

export const PEOPLE_SORTED: Person[] = [...PEOPLE].sort((a, b) =>
  faCollator.compare(a.name, b.name),
);
