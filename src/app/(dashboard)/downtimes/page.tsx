"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function DowntimesPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/downtimes").then((r) => r.json()).then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    { key: "start", header: "Début", sortable: true, sortValue: (r) => r.startTime, accessor: (r) => formatDateTime(r.startTime) },
    { key: "lot", header: "Lot", accessor: (r) => <span className="font-mono">{r.batch?.lot || "—"}</span> },
    { key: "line", header: "Ligne", accessor: (r) => r.batch?.line?.name || "—" },
    { key: "category", header: "Catégorie", accessor: (r) => {
      const cat = r.downtimeType?.subCategory?.category;
      return cat ? <Badge variant="info" className="text-xs">{cat.name}</Badge> : "—";
    }},
    { key: "subcat", header: "Sous-catégorie", accessor: (r) => r.downtimeType?.subCategory?.name || "—" },
    { key: "type", header: "Type", accessor: (r) => r.downtimeType?.name || "—" },
    { key: "duration", header: "Durée (min)", sortable: true, sortValue: (r) => r.duration || 0, accessor: (r) => r.duration != null ? Math.round(r.duration) : "En cours" },
    { key: "desc", header: "Description", accessor: (r) => r.description ? <span className="text-xs text-slate-600 max-w-[150px] truncate block">{r.description}</span> : "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Arrêts</h1>
          <p className="text-sm text-slate-500">Historique des arrêts enregistrés</p>
        </div>
        <Link href="/downtimes/new"><Button><Plus className="h-4 w-4" /> Déclarer un arrêt</Button></Link>
      </div>
      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <DataTable data={events} columns={columns} pageSize={15} searchable searchFn={(r, q) => (r.batch?.lot || "").toLowerCase().includes(q) || (r.downtimeType?.name || "").toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)} />
      )}
    </div>
  );
}
