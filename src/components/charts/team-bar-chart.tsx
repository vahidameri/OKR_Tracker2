'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartTheme } from './theme';

export interface TeamBarPoint {
  name: string;
  progress: number;
}

export function TeamBarChart({ data }: { data: TeamBarPoint[] }) {
  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fontFamily: 'Vazirmatn', fill: chartTheme.axisInk }}
            interval={0}
            axisLine={{ stroke: chartTheme.baseline }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: chartTheme.axisInk }}
            width={36}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}٪`, 'پیشرفت وزنی']}
            contentStyle={chartTheme.tooltip}
            cursor={{ fill: 'rgba(11,11,11,0.04)' }}
          />
          <Bar dataKey="progress" fill={chartTheme.primary} radius={[4, 4, 0, 0]} maxBarSize={40}>
            <LabelList
              dataKey="progress"
              position="top"
              formatter={(v: number) => `${v}٪`}
              style={{ fontSize: 11, fontFamily: 'Vazirmatn', fill: '#52514e' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
