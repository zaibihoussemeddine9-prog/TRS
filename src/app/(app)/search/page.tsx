"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Zap, Battery, MapPin } from "lucide-react";
import { BatteryIndicator } from "@/components/BatteryIndicator";

interface Scooter {
  id: string;
  name: string;
  code: string;
  status: string;
  battery: number;
  lat: number;
  lng: number;
  model: string;
  pricePerMin: number;
  address?: string;
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RENTED: "Loué",
  MAINTENANCE: "Maintenance",
  OFFLINE: "Hors ligne",
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "text-emerald-400 bg-emerald-500/10",
  RENTED: "text-red-400 bg-red-500/10",
  MAINTENANCE: "text-amber-400 bg-amber-500/10",
  OFFLINE: "text-slate-400 bg-slate-500/10",
};

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchScooters() {
      try {
        const res = await fetch("/api/scooters");
        if (res.ok) {
          const data = await res.json();
          setScooters(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchScooters();
  }, []);

  const filtered = scooters.filter((s) => {
    const matchesQuery =
      query === "" ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase()) ||
      s.model.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "ALL" || s.status === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="flex h-full flex-col bg-slate-900 pb-16 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 px-4 pt-10 pb-4">
        <h1 className="mb-4 text-2xl font-black text-white">Chercher</h1>
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, code, modèle..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["ALL", "AVAILABLE", "RENTED", "MAINTENANCE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                filter === f
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {f === "ALL" ? "Tous" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Scooter list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <Zap className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-sm">Aucun scooter trouvé</p>
          </div>
        ) : (
          filtered.map((scooter) => (
            <button
              key={scooter.id}
              onClick={() => router.push(`/rent/${scooter.id}`)}
              className="flex w-full items-center gap-4 rounded-2xl bg-slate-800 p-4 text-left transition hover:bg-slate-700 active:scale-98"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-700">
                <Zap className="h-6 w-6 text-emerald-400" strokeWidth={2} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">{scooter.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[scooter.status] || "text-slate-400 bg-slate-700"}`}
                  >
                    {STATUS_LABELS[scooter.status] || scooter.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{scooter.model} · {scooter.code}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Battery className="h-3 w-3 text-slate-500" />
                    <BatteryIndicator level={scooter.battery} size="sm" />
                  </div>
                  {scooter.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      <span className="text-xs text-slate-500 truncate max-w-[120px]">
                        {scooter.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <p className="text-base font-black text-emerald-400">{scooter.pricePerMin}</p>
                <p className="text-xs text-slate-500">DA/min</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
