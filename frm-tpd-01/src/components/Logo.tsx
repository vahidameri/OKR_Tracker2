interface Props {
  size?: number;
}

/**
 * نشان دپارتمان. فایل در public/logo.svg است تا جایگزینی‌اش فقط یک کپی باشد
 * و نیازی به تغییر کد نداشته باشد.
 */
export default function Logo({ size = 44 }: Props) {
  return (
    <img
      src="/logo.svg"
      width={size}
      height={size}
      alt="نشان دپارتمان فناوری و محصول"
      className="brand-logo"
    />
  );
}
