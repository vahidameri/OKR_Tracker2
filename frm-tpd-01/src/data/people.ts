// دادهٔ افراد و محصولات — برای ویرایش‌های بعدی فقط همین فایل را تغییر دهید

export const PRODUCTS = [
  'پیام‌رسان',
  'تماشا',
  'دیدنی',
  'سرویس ورزشی',
  'کلاسا',
  'داشبوردها و گزارش‌ها',
  'عملیات و CRM',
  'سایر',
] as const;

export type Product = (typeof PRODUCTS)[number];

/** گزینه‌ای که با انتخابش کاربر نام محصول را خودش می‌نویسد */
export const OTHER_PRODUCT: Product = 'سایر';

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
  { id: 'ali-nasimi', name: 'علی نسیمی', family: 'نسیمی', role: 'کارشناس فنی محصول شاد', defaultProduct: 'پیام‌رسان' },
  { id: 'alireza-yahyaei', name: 'علیرضا یحیایی', family: 'یحیایی', role: 'کارشناس محصول شاد — سرگرمی', defaultProduct: 'تماشا' },
  { id: 'ali-khoshnood', name: 'علی خوشنود', family: 'خوشنود', role: 'کارشناس محصول شاد — عملیات', defaultProduct: 'عملیات و CRM' },
  { id: 'kamran-ashrafi', name: 'کامران اشرفی', family: 'اشرفی', role: 'طراح ارشد محصول شاد' },
  { id: 'vahid-ameri', name: 'وحید عامری', family: 'عامری', role: 'کارشناس مدیریت پروژه شاد' },
  { id: 'morteza-safarshahi', name: 'مرتضی صفرشاهی', family: 'صفرشاهی', role: 'سرپرست تیم فنی شاد' },
  { id: 'alireza-jafari', name: 'علیرضا جعفری', family: 'جعفری', role: 'کارشناس نرم‌افزار شاد' },
  { id: 'mohammad-sajadpour', name: 'محمد سجادپور', family: 'سجادپور', role: 'کارشناس نرم‌افزار شاد' },
  { id: 'ali-roudi', name: 'علی رودی', family: 'رودی', role: 'کارشناس نرم‌افزار شاد' },
  { id: 'misagh-riginejad', name: 'میثاق ریگی‌نژاد', family: 'ریگی‌نژاد', role: 'کارشناس محصول شاد — آموزش', defaultProduct: 'کلاسا' },
  { id: 'zahra-nateghi', name: 'زهرا ناطقی', family: 'ناطقی', role: 'کارشناس پایش محصول شاد' },
  { id: 'mona-nobari', name: 'مونا نوبری', family: 'نوبری', role: 'مدیریت ارتباط با مشتری شاد', defaultProduct: 'عملیات و CRM' },
  { id: 'pardis-ghasemi', name: 'پردیس قاسمی', family: 'قاسمی', role: 'کارشناس تحلیل‌گر داده محصول شاد', defaultProduct: 'داشبوردها و گزارش‌ها' },
  { id: 'jalil-alizadeh', name: 'جلیل علیزاده', family: 'علیزاده', role: 'مدیر محصول و تکنولوژی شاد' },
];

export function findPerson(id: string | null): Person | undefined {
  return PEOPLE.find((p) => p.id === id);
}

/** فهرست افراد مرتب‌شده بر اساس نام خانوادگی (ترتیب فایل بالا دست‌نخورده می‌ماند) */
const faCollator = new Intl.Collator('fa');

export const PEOPLE_SORTED: Person[] = [...PEOPLE].sort((a, b) =>
  faCollator.compare(a.family, b.family),
);
