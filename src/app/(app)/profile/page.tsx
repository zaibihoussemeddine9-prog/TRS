"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  LogOut,
  Zap,
  History,
  DollarSign,
  Shield,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Stats {
  totalRides: number;
  totalSpent: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ totalRides: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/rentals");
        if (res.ok) {
          const rentals = await res.json();
          const completed = rentals.filter((r: { status: string; totalCost?: number }) => r.status === "COMPLETED");
          const totalSpent = completed.reduce(
            (sum: number, r: { totalCost?: number }) => sum + (r.totalCost ?? 0),
            0
          );
          setStats({ totalRides: completed.length, totalSpent });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const user = session?.user;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-900 pb-16 overflow-y-auto">
      {/* Header / Avatar */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-4 pt-10 pb-8 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500 shadow-xl shadow-emerald-500/30">
          <User className="h-12 w-12 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-black text-white">{user?.name ?? "Utilisateur"}</h1>
        <p className="text-sm text-slate-400">{user?.email}</p>
        {user?.role === "ADMIN" && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <Shield className="h-3 w-3" />
            Administrateur
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <div className="rounded-2xl bg-slate-800 p-4 text-center">
          <div className="mb-1 flex items-center justify-center gap-1.5 text-slate-400">
            <History className="h-4 w-4" />
            <span className="text-xs font-medium">Courses</span>
          </div>
          <p className="text-3xl font-black text-white">{stats.totalRides}</p>
        </div>
        <div className="rounded-2xl bg-slate-800 p-4 text-center">
          <div className="mb-1 flex items-center justify-center gap-1.5 text-slate-400">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">Dépensé</span>
          </div>
          <p className="text-3xl font-black text-emerald-400">{stats.totalSpent.toFixed(0)}</p>
          <p className="text-xs text-slate-500">DA</p>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Informations
        </p>

        <div className="rounded-2xl bg-slate-800 overflow-hidden divide-y divide-slate-700/50">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Nom complet</p>
              <p className="text-sm font-semibold text-white truncate">
                {user?.name ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700">
              <Mail className="h-4 w-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-semibold text-white truncate">
                {user?.email ?? "—"}
              </p>
            </div>
          </div>

          {user?.phone && (
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700">
                <Phone className="h-4 w-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Téléphone</p>
                <p className="text-sm font-semibold text-white">{user.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin access */}
      {user?.role === "ADMIN" && (
        <div className="px-4 pb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Administration
          </p>
          <button
            onClick={() => router.push("/admin")}
            className="flex w-full items-center gap-3 rounded-2xl bg-slate-800 p-4 transition hover:bg-slate-700"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Tableau de bord admin</p>
              <p className="text-xs text-slate-400">Gérer la flotte</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="mt-auto px-4 pb-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-4 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
