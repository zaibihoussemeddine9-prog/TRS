"use client";

interface BatteryIndicatorProps {
  level: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function BatteryIndicator({ level, size = "md", showLabel = true }: BatteryIndicatorProps) {
  const color =
    level >= 60
      ? "bg-emerald-500"
      : level >= 30
      ? "bg-amber-500"
      : "bg-red-500";

  const textColor =
    level >= 60 ? "text-emerald-400" : level >= 30 ? "text-amber-400" : "text-red-400";

  const heights = { sm: "h-1.5", md: "h-2", lg: "h-3" };
  const widths = { sm: "w-8", md: "w-12", lg: "w-16" };
  const textSizes = { sm: "text-xs", md: "text-xs", lg: "text-sm" };

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${widths[size]} ${heights[size]} rounded-full bg-slate-700`}>
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(level, 0)}%` }}
        />
      </div>
      {showLabel && (
        <span className={`font-semibold ${textSizes[size]} ${textColor}`}>{level}%</span>
      )}
    </div>
  );
}
