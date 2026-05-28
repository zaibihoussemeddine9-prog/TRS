"use client";

import { useEffect, useState } from "react";
import { Timer, DollarSign } from "lucide-react";

interface RentalTimerProps {
  startTime: string | Date;
  pricePerMin: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RentalTimer({ startTime, pricePerMin }: RentalTimerProps) {
  const start = new Date(startTime).getTime();

  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - start) / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [start]);

  const minutes = elapsed / 60;
  const cost = Math.round(minutes * pricePerMin * 100) / 100;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-center rounded-2xl bg-slate-900 p-4">
        <div className="mb-1 flex items-center gap-1.5 text-slate-400">
          <Timer className="h-4 w-4" />
          <span className="text-xs font-medium">Durée</span>
        </div>
        <span className="text-xl font-black text-white tabular-nums">
          {formatDuration(elapsed)}
        </span>
      </div>
      <div className="flex flex-col items-center rounded-2xl bg-slate-900 p-4">
        <div className="mb-1 flex items-center gap-1.5 text-slate-400">
          <DollarSign className="h-4 w-4" />
          <span className="text-xs font-medium">Coût</span>
        </div>
        <span className="text-xl font-black text-emerald-400 tabular-nums">
          {cost.toFixed(2)} DA
        </span>
      </div>
    </div>
  );
}
