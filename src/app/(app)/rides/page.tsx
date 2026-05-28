"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Zap, Clock, DollarSign, ChevronRight, Loader2 } from "lucide-react";
import { RentalTimer } from "@/components/RentalTimer";

interface Rental {
  id: string;
  startTime: string;
  endTime?: string;
  durationMin?: number;
  totalCost?: number;
  status: string;
  scooter: {
    id: string;
    name: string;
    code: string;
    model: string;
    pricePerMin: number;
  };
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

export default function RidesPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [activeRental, setActiveRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [rentalsRes, activeRes] = await Promise.all([
          fetch("/api/rentals"),
          fetch("/api/rentals/active"),
        ]);

        if (rentalsRes.ok) {
          const data: Rental[] = await rentalsRes.json();
          setRentals(data.filter((r) => r.status !== "ACTIVE"));
        }

        if (activeRes.ok) {
          const active = await activeRes.json();
          setActiveRental(active || null);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex h-full flex-col bg-slate-900 pb-16 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 px-4 pt-10 pb-4">
        <h1 className="text-2xl font-black text-white">Mes courses</h1>
        <p className="text-sm text-slate-400">Historique de vos locations</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* Active rental */}
            {activeRental && (
              <div className="mb-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Course active
                </p>
                <button
                  onClick={() => router.push(`/rent/${activeRental.scooter.id}`)}
                  className="w-full rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-left transition hover:bg-emerald-500/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 pulse-green" />
                      <span className="text-sm font-bold text-emerald-400">En cours</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-emerald-400" />
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                      <Zap className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{activeRental.scooter.name}</p>
                      <p className="text-xs text-slate-400">{activeRental.scooter.model}</p>
                    </div>
                  </div>

                  <RentalTimer
                    startTime={activeRental.startTime}
                    pricePerMin={activeRental.scooter.pricePerMin}
                  />
                </button>
              </div>
            )}

            {/* Past rentals */}
            {rentals.length === 0 && !activeRental ? (
              <div className="flex flex-col items-center py-16 text-slate-500">
                <History className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-sm font-medium">Aucune course pour le moment</p>
                <p className="mt-1 text-xs text-slate-600">
                  Louez votre première trottinette sur la carte
                </p>
                <button
                  onClick={() => router.push("/map")}
                  className="mt-4 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white"
                >
                  Voir la carte
                </button>
              </div>
            ) : (
              <>
                {rentals.length > 0 && (
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Historique
                  </p>
                )}
                {rentals.map((rental) => (
                  <div
                    key={rental.id}
                    className="rounded-2xl bg-slate-800 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700">
                          <Zap className="h-5 w-5 text-slate-300" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{rental.scooter.name}</p>
                          <p className="text-xs text-slate-400">{rental.scooter.model}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          rental.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {rental.status === "COMPLETED" ? "Terminé" : rental.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {rental.durationMin != null
                            ? formatDuration(rental.durationMin)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="font-bold text-emerald-400">
                          {rental.totalCost != null
                            ? `${rental.totalCost.toFixed(2)} DA`
                            : "—"}
                        </span>
                      </div>
                      <span className="ml-auto text-slate-500">
                        {format(new Date(rental.startTime), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
