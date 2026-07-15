'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface TrendChartPoint {
  week: string;
  progress: number;
}

export function TrendChart({ data }: { data: TrendChartPoint[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">هنوز چک‌این هفتگی ثبت نشده است.</p>;
  }
  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="week" tick={{ fontSize: 12, fontFamily: 'Vazirmatn' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} width={36} />
          <Tooltip
            formatter={(value) => [`${value}٪`, 'پیشرفت']}
            labelFormatter={(label) => `هفته ${label}`}
            contentStyle={{ fontFamily: 'Vazirmatn', direction: 'rtl' }}
          />
          <Line
            type="monotone"
            dataKey="progress"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#2563eb' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
