"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Zap,
  Battery,
  MapPin,
  Clock,
  Unlock,
  StopCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { BatteryIndicator } from "@/components/BatteryIndicator";
import { RentalTimer } from "@/components/RentalTimer";

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
  maxSpeed: number;
  address?: string;
  color: string;
}

interface Rental {
  id: string;
  scooterId: string;
  startTime: string;
  status: string;
  scooter: {
    id: string;
    name: string;
    pricePerMin: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RENTED: "Loué",
  MAINTENANCE: "En maintenance",
  OFFLINE: "Hors ligne",
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  RENTED: "text-red-400 bg-red-500/10 border-red-500/30",
  MAINTENANCE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  OFFLINE: "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

export default function RentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [scooter, setScooter] = useState<Scooter | null>(null);
  const [activeRental, setActiveRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [scooterRes, rentalRes] = await Promise.all([
        fetch(`/api/scooters/${id}`),
        fetch("/api/rentals/active"),
      ]);

      if (scooterRes.ok) {
        setScooter(await scooterRes.json());
      }

      if (rentalRes.ok) {
        const rental = await rentalRes.json();
        setActiveRental(rental);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStartRental() {
    if (!scooter) return;
    setError("");
    setActionLoading(true);

    try {
      let startLat: number | undefined;
      let startLng: number | undefined;

      // Try to get user location
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              startLat = pos.coords.latitude;
              startLng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      }

      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scooterId: scooter.id,
          startLat: startLat ?? scooter.lat,
          startLng: startLng ?? scooter.lng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du démarrage");
      } else {
        await fetchData();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEndRental() {
    if (!activeRental) return;
    setError("");
    setActionLoading(true);

    try {
      let endLat: number | undefined;
      let endLng: number | undefined;

      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              endLat = pos.coords.latitude;
              endLng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      }

      const res = await fetch(`/api/rentals/${activeRental.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endLat, endLng }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'arrêt");
      } else {
        router.push("/rides");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!scooter) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-900 px-6">
        <AlertCircle className="mb-3 h-12 w-12 text-red-400" />
        <p className="text-slate-400">Scooter introuvable</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-emerald-400 hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  const isMyRental = activeRental?.scooterId === scooter.id;
  const hasOtherRental = activeRental && !isMyRental;
  const canRent = scooter.status === "AVAILABLE" && !activeRental;

  return (
    <div className="flex h-full flex-col bg-slate-900 pb-16 overflow-y-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 px-4 pb-6 pt-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-700 transition hover:bg-slate-600"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        {/* Scooter icon */}
        <div className="mb-4 flex justify-center">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-3xl shadow-2xl"
            style={{ background: scooter.color || "#10b981" }}
          >
            <Zap className="h-14 w-14 text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Name and status */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">{scooter.name}</h1>
          <p className="mb-3 text-sm text-slate-400">{scooter.model} · {scooter.code}</p>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[scooter.status] || ""}`}
          >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
            {STATUS_LABELS[scooter.status] || scooter.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        <div className="rounded-2xl bg-slate-800 p-3 text-center">
          <Battery className="mx-auto mb-1 h-4 w-4 text-slate-400" />
          <p className="text-xs text-slate-500 mb-1">Batterie</p>
          <BatteryIndicator level={scooter.battery} size="sm" />
        </div>
        <div className="rounded-2xl bg-slate-800 p-3 text-center">
          <Clock className="mx-auto mb-1 h-4 w-4 text-slate-400" />
          <p className="text-xs text-slate-500 mb-1">Prix</p>
          <p className="text-sm font-black text-emerald-400">{scooter.pricePerMin} DA</p>
          <p className="text-xs text-slate-500">/min</p>
        </div>
        <div className="rounded-2xl bg-slate-800 p-3 text-center">
          <Zap className="mx-auto mb-1 h-4 w-4 text-slate-400" />
          <p className="text-xs text-slate-500 mb-1">Vitesse max</p>
          <p className="text-sm font-black text-white">{scooter.maxSpeed} km/h</p>
        </div>
      </div>

      {/* Location */}
      {scooter.address && (
        <div className="mx-4 mb-4 flex items-start gap-3 rounded-2xl bg-slate-800 p-4">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <p className="text-xs font-medium text-slate-400 mb-0.5">Localisation actuelle</p>
            <p className="text-sm text-white">{scooter.address}</p>
          </div>
        </div>
      )}

      {/* Active rental timer */}
      {isMyRental && activeRental && (
        <div className="mx-4 mb-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Course en cours
          </p>
          <RentalTimer
            startTime={activeRental.startTime}
            pricePerMin={activeRental.scooter.pricePerMin}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Action button */}
      <div className="mt-auto px-4 pb-4">
        {isMyRental ? (
          <button
            onClick={handleEndRental}
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-500 py-4 text-sm font-bold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-400 active:scale-95 disabled:opacity-60"
          >
            {actionLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <StopCircle className="h-5 w-5" />
            )}
            {actionLoading ? "Arrêt en cours..." : "Terminer la course"}
          </button>
        ) : canRent ? (
          <button
            onClick={handleStartRental}
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-60"
          >
            {actionLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Unlock className="h-5 w-5" />
            )}
            {actionLoading ? "Déverrouillage..." : "Déverrouiller & Louer"}
          </button>
        ) : (
          <button
            disabled
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-700 py-4 text-sm font-bold text-slate-400 cursor-not-allowed"
          >
            {hasOtherRental ? "Vous avez déjà une course active" : "Indisponible"}
          </button>
        )}
      </div>
    </div>
  );
}
