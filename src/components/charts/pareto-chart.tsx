"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface ParetoChartProps {
  data: { name: string; value: number; cumulative?: number }[];
  height?: number;
  unit?: string;
}

export function ParetoChart({ data, height = 350, unit = "min" }: ParetoChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumPct = 0;
  const chartData = data
    .sort((a, b) => b.value - a.value)
    .map((d) => {
      cumPct += total > 0 ? d.value / total : 0;
      return { ...d, cumulative: cumPct };
    });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="name"
          fontSize={11}
          tickLine={false}
          angle={-35}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" fontSize={12} tickLine={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          domain={[0, 1]}
          fontSize={12}
          tickLine={false}
        />
        <Tooltip
          formatter={(value, name) =>
            name === "cumulative" ? `${(Number(value) * 100).toFixed(1)}%` : `${value} ${unit}`
          }
          contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
        />
        <Bar yAxisId="left" dataKey="value" name="Durée" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumulative"
          name="Cumulé"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
