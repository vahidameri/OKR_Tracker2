/**
 * عنوان صفحه را موقتاً عوض می‌کند تا نام پیشنهادی فایل PDF از عنوان درخواست
 * ساخته شود، پنجرهٔ چاپ را باز می‌کند و پس از چاپ عنوان را برمی‌گرداند.
 */
export function openPrintDialog(title: string) {
  const prevTitle = document.title;
  const firstWords = title.trim().split(/\s+/).filter(Boolean).slice(0, 5).join(' ');
  document.title = `FRM-TPD-01_${firstWords || 'درخواست کار'}`;
  const restore = () => {
    document.title = prevTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}
