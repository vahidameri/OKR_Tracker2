interface Props {
  size?: number;
}

/**
 * نشان دپارتمان — به‌صورت SVG درون‌خطی تا بدون فایل تصویری و بدون اینترنت
 * در هر اندازه‌ای تیز بماند.
 */
export default function Logo({ size = 40 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="نشان دپارتمان فناوری و محصول"
    >
      <defs>
        <linearGradient id="logo-tile" x1="16" y1="6" x2="48" y2="58">
          <stop offset="0" stopColor="#9CEBC6" />
          <stop offset="1" stopColor="#4FD3A0" />
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="17" fill="url(#logo-tile)" />

      {/* سه نقطهٔ سفید با دور تیره */}
      <circle cx="32" cy="23" r="5.4" fill="#fff" stroke="#12261F" strokeWidth="2.4" />
      <circle cx="21" cy="33" r="5.4" fill="#fff" stroke="#12261F" strokeWidth="2.4" />
      <circle cx="43" cy="33" r="5.4" fill="#fff" stroke="#12261F" strokeWidth="2.4" />

      {/* موج زرد: ابتدا دور تیره، سپس بدنهٔ زرد روی آن */}
      <path
        d="M14 45 L23 38.5 L32 45.5 L41 38.5 L50 45"
        stroke="#12261F"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 45 L23 38.5 L32 45.5 L41 38.5 L50 45"
        stroke="#F2C42B"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
