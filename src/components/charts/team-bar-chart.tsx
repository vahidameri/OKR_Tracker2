'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface TeamBarPoint {
  name: string;
  progress: number;
}

function barColor(p: number) {
  if (p >= 100) return '#2563eb';
  if (p >= 60) return '#16a34a';
  if (p >= 30) return '#d97706';
  return '#dc2626';
}

export function TeamBarChart({ data }: { data: TeamBarPoint[] }) {
  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Vazirmatn' }} interval={0} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} width={36} />
          <Tooltip
            formatter={(value) => [`${value}٪`, 'پیشرفت']}
            contentStyle={{ fontFamily: 'Vazirmatn', direction: 'rtl' }}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((d) => (
              <Cell key={d.name} fill={barColor(d.progress)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
