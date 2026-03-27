"use client";

import { cn } from "@/lib/utils";
import { formatPercent, getKPIColor } from "@/lib/trs-calculations";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number;
  isPercent?: boolean;
  unit?: string;
  trend?: number;
  greenMin?: number;
  orangeMin?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({
  title,
  value,
  isPercent = true,
  unit,
  trend,
  greenMin = 0.85,
  orangeMin = 0.65,
  icon,
  className,
}: KPICardProps) {
  const color = isPercent ? getKPIColor(value, greenMin, orangeMin) : "green";
  const colorMap = {
    green: "border-l-emerald-500",
    orange: "border-l-amber-500",
    red: "border-l-red-500",
  };
  const textColorMap = {
    green: "text-emerald-600",
    orange: "text-amber-600",
    red: "text-red-600",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm border-l-4 p-5",
        colorMap[color],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={cn("mt-1 text-3xl font-bold", textColorMap[color])}>
            {isPercent ? formatPercent(value) : value.toLocaleString("fr-FR")}
            {unit && <span className="ml-1 text-base font-normal text-slate-400">{unit}</span>}
          </p>
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : trend < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-500" />
          ) : (
            <Minus className="h-4 w-4 text-slate-400" />
          )}
          <span className={trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-600" : "text-slate-500"}>
            {trend > 0 ? "+" : ""}
            {(trend * 100).toFixed(1)}% vs période préc.
          </span>
        </div>
      )}
    </div>
  );
}
