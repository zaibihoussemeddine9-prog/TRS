"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getKPIColor } from "@/lib/trs-calculations";

interface OEEBarChartProps {
  data: { name: string; oee: number; availability: number; performance: number; quality: number }[];
  height?: number;
}

const colorMap = { green: "#10b981", orange: "#f59e0b", red: "#ef4444" };

export function OEEBarChart({ data, height = 300 }: OEEBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" fontSize={12} tickLine={false} />
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
        <Bar dataKey="oee" name="TRS" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={colorMap[getKPIColor(entry.oee)]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
