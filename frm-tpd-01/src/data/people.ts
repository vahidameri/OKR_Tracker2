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
  /** نام خانوادگی — کلید مرتب‌سازی الفبایی فهرست */
  family: string;
  role: string;
  /** محصول پیش‌فرض برای پیش‌انتخاب در مرحلهٔ مشخصات */
  defaultProduct?: Product;
}

export const PEOPLE: Person[] = [
  { id: 'vahid-ameri', name: 'وحید عامری', family: 'عامری', role: 'مدیر برنامه (PgM)' },
  { id: 'jalil-alizadeh', name: 'جلیل علیزاده', family: 'علیزاده', role: 'مدیر دپارتمان' },
  { id: 'kamran-ashrafi', name: 'کامران اشرفی', family: 'اشرفی', role: 'پروداکت دیزاینر' },
  { id: 'pardis-ghasemi', name: 'پردیس قاسمی', family: 'قاسمی', role: 'دیتا آنالیست', defaultProduct: 'داشبوردها و گزارش‌ها' },
  { id: 'ali-khoshnood', name: 'علی خوشنود', family: 'خوشنود', role: 'مدیر محصول عملیات', defaultProduct: 'پنل ادمین و CRM' },
  { id: 'morteza-safari', name: 'مرتضی صفری شاهی', family: 'صفری شاهی', role: 'تک‌لید شاد', defaultProduct: 'زیرساخت و سرویس‌های مشترک' },
  { id: 'misagh-riginejad', name: 'میثاق ریگی‌نژاد', family: 'ریگی‌نژاد', role: 'مدیر محصول کلاسا', defaultProduct: 'کلاسا' },
  { id: 'alireza-yahyaei', name: 'علیرضا یحیایی', family: 'یحیایی', role: 'مدیر محصول تماشا، سرویس ورزشی و VOD', defaultProduct: 'تماشا' },
  { id: 'mona-khosronobari', name: 'مونا خسرونوبری', family: 'خسرونوبری', role: 'CRM', defaultProduct: 'پنل ادمین و CRM' },
  { id: 'zahra-nateghi', name: 'زهرا ناطقی', family: 'ناطقی', role: 'پایش', defaultProduct: 'پنل ادمین و CRM' },
  { id: 'ali-nasimi', name: 'علی نسیمی', family: 'نسیمی', role: 'مدیر محصول پیام‌رسان', defaultProduct: 'شاد مسنجر' },
  { id: 'ali-roudi', name: 'علی رودی', family: 'رودی', role: 'دولوپر' },
  { id: 'mohammad-sajadpour', name: 'محمد سجادپور', family: 'سجادپور', role: 'دولوپر' },
  { id: 'alireza-jafari', name: 'علیرضا جعفری', family: 'جعفری', role: 'دولوپر' },
];

export function findPerson(id: string | null): Person | undefined {
  return PEOPLE.find((p) => p.id === id);
}

/** فهرست افراد مرتب‌شده بر اساس نام خانوادگی (ترتیب فایل بالا دست‌نخورده می‌ماند) */
const faCollator = new Intl.Collator('fa');

export const PEOPLE_SORTED: Person[] = [...PEOPLE].sort((a, b) =>
  faCollator.compare(a.family, b.family),
);
