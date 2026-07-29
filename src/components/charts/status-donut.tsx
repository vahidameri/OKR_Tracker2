'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { chartTheme } from './theme';

const STATUS_META = [
  { key: 'ON_TRACK', label: 'در مسیر', icon: '●' },
  { key: 'AT_RISK', label: 'در ریسک', icon: '▲' },
  { key: 'BLOCKED', label: 'بلاک‌شده', icon: '■' },
  { key: 'COMPLETED', label: 'تکمیل‌شده', icon: '✔' },
] as const;

export function StatusDonut({
  counts,
  noCheckIn,
}: {
  counts: Record<string, number>;
  noCheckIn: number;
}) {
  const data: { name: string; key: string; value: number }[] = STATUS_META.filter(
    (s) => (counts[s.key] ?? 0) > 0
  ).map((s) => ({
    name: s.label,
    key: s.key as string,
    value: counts[s.key] ?? 0,
  }));
  if (noCheckIn > 0) data.push({ name: 'بدون چک‌این', key: 'NONE', value: noCheckIn });

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای برای نمایش نیست.</p>;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div dir="ltr" className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value, name) => [`${value} مورد`, name]}
              contentStyle={chartTheme.tooltip}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              strokeWidth={2}
              stroke={chartTheme.surface}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.key === 'NONE' ? chartTheme.empty : chartTheme.status[d.key]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black">{total}</span>
          <span className="text-xs text-muted-foreground">KR-تیم</span>
        </div>
      </div>
      <ul className="min-w-36 space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: d.key === 'NONE' ? chartTheme.empty : chartTheme.status[d.key] }}
              />
              {d.name}
            </span>
            <span className="font-bold tabular-nums">
              {d.value}
              <span className="mr-1 text-xs font-normal text-muted-foreground">
                ({Math.round((d.value / total) * 100)}٪)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
