import { toFaDigits } from '../lib/jalali';

interface Props {
  score: number;
}

const SIZE = 168;
const STROKE = 13;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/** رنگ و برچسب حلقه بر اساس امتیاز — از قرمز تا سبز */
function band(score: number) {
  if (score >= 85) return { color: 'var(--tone-low)', label: 'آمادهٔ ارسال' };
  if (score >= 70) return { color: 'var(--brand)', label: 'قابل قبول' };
  if (score >= 50) return { color: 'var(--tone-medium)', label: 'نیاز به تکمیل' };
  return { color: 'var(--tone-critical)', label: 'ناقص' };
}

/** نمایش حلقه‌ای امتیاز آمادگی */
export default function ScoreRing({ score }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const { color, label } = band(clamped);
  const offset = C * (1 - clamped / 100);

  return (
    <div className="score-ring" role="img" aria-label={`امتیاز آمادگی: ${score} از ۱۰۰`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* مسیر پس‌زمینه */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--line-soft)"
          strokeWidth={STROKE}
        />
        {/* پیشرفت — از بالا و در جهت عقربه‌های ساعت */}
        <circle
          className="score-ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className="score-ring-center">
        <span className="score-ring-value" style={{ color }}>
          {toFaDigits(clamped)}
        </span>
        <span className="score-ring-unit">از {toFaDigits(100)}</span>
      </div>
      <p className="score-ring-label" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
