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
import { chartTheme } from './theme';

export interface TrendChartPoint {
  week: string;
  progress: number;
}

export function TrendChart({ data, height = 256 }: { data: TrendChartPoint[]; height?: number }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">هنوز چک‌این هفتگی ثبت نشده است.</p>;
  }
  return (
    <div dir="ltr" style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fontFamily: 'Vazirmatn FD, Vazirmatn', fill: chartTheme.axisInk }}
            axisLine={{ stroke: chartTheme.baseline }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fontFamily: 'Vazirmatn FD, Vazirmatn', fill: chartTheme.axisInk }}
            width={36}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}٪`, 'پیشرفت وزنی']}
            labelFormatter={(label) => `هفته ${label}`}
            contentStyle={chartTheme.tooltip}
          />
          <Line
            type="monotone"
            dataKey="progress"
            stroke={chartTheme.primary}
            strokeWidth={2}
            dot={{ r: 3, fill: chartTheme.primary, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
