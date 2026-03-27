"use client";

import { formatPercent, getKPIColor } from "@/lib/trs-calculations";

interface OEEGaugeProps {
  value: number;
  label?: string;
  size?: number;
}

export function OEEGauge({ value, label = "TRS", size = 160 }: OEEGaugeProps) {
  const color = getKPIColor(value);
  const colorHex = { green: "#10b981", orange: "#f59e0b", red: "#ef4444" }[color];
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - Math.min(value, 1));

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke={colorHex}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          className="text-2xl font-bold"
          fill={colorHex}
          fontSize="24"
          fontWeight="bold"
        >
          {formatPercent(value)}
        </text>
      </svg>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}
