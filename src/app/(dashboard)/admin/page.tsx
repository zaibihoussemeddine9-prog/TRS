"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  WifiOff,
  DollarSign,
  Users,
  RefreshCw,
  Loader2,
  Battery,
  Clock,
} from "lucide-react";
import { BatteryIndicator } from "@/components/BatteryIndicator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Stats {
  fleet: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    offline: number;
  };
  revenue: { today: number; total: number };
  activeRentals: number;
  totalUsers: number;
}

interface Scooter {
  id: string;
  name: string;
  code: string;
  status: string;
  battery: number;
  model: string;
  lastPing: string;
  lat: number;
  lng: number;
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
  OFFLINE: "text-slate-400 bg-slate-700",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/map");
    }
  }, [status, session, router]);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, scootersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/scooters"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (scootersRes.ok) setScooters(await scootersRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function updateStatus(scooterId: string, newStatus: string) {
    setUpdatingId(scooterId);
    try {
      const res = await fetch(`/api/scooters/${scooterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setScooters((prev) =>
          prev.map((s) => (s.id === scooterId ? { ...s, status: newStatus } : s))
        );
        fetchData();
      }
    } finally {
      setUpdatingId(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Tableau de bord</h1>
          <p className="text-sm text-slate-400">Gestion de la flotte ScootDZ</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-700">
                <Zap className="h-4 w-4 text-slate-300" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.fleet.total}</p>
            <p className="text-xs text-slate-500 mt-1">trottinettes</p>
          </div>

          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Disponibles</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.fleet.available}</p>
            <p className="text-xs text-emerald-600 mt-1">en service</p>
          </div>

          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Louées</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20">
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.fleet.rented}</p>
            <p className="text-xs text-red-600 mt-1">{stats.activeRentals} active{stats.activeRentals !== 1 ? "s" : ""}</p>
          </div>

          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Maintenance</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.fleet.maintenance}</p>
            <p className="text-xs text-amber-600 mt-1">en réparation</p>
          </div>
        </div>
      )}

      {/* Revenue + Users */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-800 p-4">
            <div className="mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400">Revenus aujourd&apos;hui</span>
            </div>
            <p className="text-2xl font-black text-emerald-400">{stats.revenue.today.toFixed(0)} DA</p>
            <p className="text-xs text-slate-500 mt-1">Total: {stats.revenue.total.toFixed(0)} DA</p>
          </div>
          <div className="rounded-2xl bg-slate-800 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-400">Utilisateurs</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
            <p className="text-xs text-slate-500 mt-1">riders enregistrés</p>
          </div>
        </div>
      )}

      {/* Scooters table */}
      <div>
        <h2 className="mb-3 text-base font-bold text-white">Flotte complète</h2>
        <div className="rounded-2xl bg-slate-800 overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 py-3 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span>Scooter</span>
            <span>Modèle</span>
            <span>Statut</span>
            <span className="flex items-center gap-1"><Battery className="h-3 w-3" /> Batterie</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Dernier ping</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-slate-700/30">
            {scooters.map((scooter) => (
              <div
                key={scooter.id}
                className="flex flex-col gap-3 px-4 py-4 md:grid md:grid-cols-6 md:items-center md:gap-4"
              >
                {/* Name */}
                <div>
                  <p className="font-bold text-white">{scooter.name}</p>
                  <p className="text-xs text-slate-500">{scooter.code}</p>
                </div>

                {/* Model */}
                <p className="text-sm text-slate-300 hidden md:block">{scooter.model}</p>

                {/* Status */}
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[scooter.status] || "text-slate-400 bg-slate-700"}`}
                >
                  {STATUS_LABELS[scooter.status] || scooter.status}
                </span>

                {/* Battery */}
                <BatteryIndicator level={scooter.battery} size="sm" />

                {/* Last ping */}
                <p className="text-xs text-slate-500 hidden md:block">
                  {format(new Date(scooter.lastPing), "dd/MM HH:mm", { locale: fr })}
                </p>

                {/* Status change */}
                <div className="flex gap-2">
                  {updatingId === scooter.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : (
                    <select
                      value={scooter.status}
                      onChange={(e) => updateStatus(scooter.id, e.target.value)}
                      disabled={scooter.status === "RENTED"}
                      className="rounded-xl border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="AVAILABLE">Disponible</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="OFFLINE">Hors ligne</option>
                      {scooter.status === "RENTED" && <option value="RENTED">Loué</option>}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>

          {scooters.length === 0 && (
            <div className="flex flex-col items-center py-12 text-slate-500">
              <WifiOff className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Aucun scooter dans la flotte</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
