import dynamic from "next/dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Search, Zap, ChevronDown } from "lucide-react";

const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

export default async function MapPage() {
  const session = await getServerSession(authOptions);

  const scooters = await prisma.scooter.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      battery: true,
      lat: true,
      lng: true,
      model: true,
      pricePerMin: true,
    },
  });

  const available = scooters.filter((s) => s.status === "AVAILABLE").length;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Full-screen map */}
      <MapClient scooters={scooters} />

      {/* Top overlay - Search bar */}
      <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Header with greeting */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Bonjour, {session?.user?.name?.split(" ")[0] ?? "Rider"} 👋
              </p>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs text-emerald-400 font-semibold">
                  {available} trottinette{available !== 1 ? "s" : ""} disponible{available !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-800/90 shadow-lg">
              <Zap className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-2xl bg-slate-800/95 px-4 py-3 shadow-xl backdrop-blur-md">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="flex-1 text-sm text-slate-400">Chercher une adresse...</span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Legend overlay bottom */}
      <div className="absolute bottom-20 right-4 z-10 pointer-events-none">
        <div className="rounded-2xl bg-slate-800/90 p-3 shadow-xl backdrop-blur-md">
          <p className="mb-2 text-xs font-semibold text-slate-400">Légende</p>
          <div className="space-y-1.5">
            {[
              { color: "bg-emerald-500", label: "Disponible" },
              { color: "bg-red-500", label: "Loué" },
              { color: "bg-amber-500", label: "Maintenance" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <span className="text-xs text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup styles injection */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-tip-container {
          display: none !important;
        }
        .scooter-popup .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          overflow: hidden;
        }
        .leaflet-control-attribution {
          background: rgba(15, 23, 42, 0.7) !important;
          color: #475569 !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a {
          color: #64748b !important;
        }
        .leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .leaflet-bar a {
          background: #1e293b !important;
          color: white !important;
          border: 1px solid #334155 !important;
        }
        .leaflet-bar a:hover {
          background: #334155 !important;
        }
      `}</style>
    </div>
  );
}
