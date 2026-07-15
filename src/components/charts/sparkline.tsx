'use client';

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { chartTheme } from './theme';

/** نمودار خطی کوچک روند تیم (مکمل نوار پیشرفت، بدون محور) */
export function Sparkline({ data }: { data: { progress: number }[] }) {
  if (data.length < 2) return null;
  return (
    <div dir="ltr" className="h-10 w-full" title="روند هفتگی پیشرفت">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={[0, 100]} hide />
          <Line
            type="monotone"
            dataKey="progress"
            stroke={chartTheme.primary}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
