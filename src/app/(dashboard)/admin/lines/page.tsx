"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";

export default function AdminLinesPage() {
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lines").then((r) => r.json()).then((data) => { setLines(data); setLoading(false); });
  }, []);

  const columns: Column<any>[] = [
    { key: "code", header: "Code", sortable: true, sortValue: (r) => r.code, accessor: (r) => r.code },
    { key: "name", header: "Nom", accessor: (r) => r.name },
    { key: "workshop", header: "Atelier", accessor: (r) => r.workshop?.name },
    { key: "site", header: "Site", accessor: (r) => r.workshop?.site?.name },
    { key: "speed", header: "Vitesse par défaut", accessor: (r) => r.defaultSpeed || "—" },
    { key: "active", header: "Actif", accessor: (r) => r.active ? "Oui" : "Non" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Lignes de conditionnement</h1>
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <DataTable data={lines} columns={columns} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)} />
      )}
    </div>
  );
}
