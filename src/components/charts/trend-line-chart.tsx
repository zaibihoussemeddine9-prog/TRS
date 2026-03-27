"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface TrendLineChartProps {
  data: { date: string; oee: number; availability: number; performance: number; quality: number }[];
  height?: number;
  target?: number;
}

export function TrendLineChart({ data, height = 300, target }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" fontSize={12} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          domain={[0, 1]}
          fontSize={12}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
        />
        <Legend />
        {target && (
          <ReferenceLine y={target} stroke="#94a3b8" strokeDasharray="5 5" label="Objectif" />
        )}
        <Line type="monotone" dataKey="oee" name="TRS" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="availability" name="Disponibilité" stroke="#10b981" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="performance" name="Performance" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="quality" name="Qualité" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
