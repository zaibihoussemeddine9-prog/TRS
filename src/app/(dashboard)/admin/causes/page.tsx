"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export default function AdminCausesPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/causes").then(r => r.json()).then(setTypes).catch(() => setTypes([])).finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    { key: "code", header: "Code", sortable: true, sortValue: (r) => r.code, accessor: (r) => <span className="font-mono font-semibold">{r.code}</span> },
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, accessor: (r) => r.name },
    { key: "category", header: "Catégorie", accessor: (r) => <Badge variant="info">{r.category}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Types d&apos;arrêt</h1>
      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <DataTable data={types} columns={columns} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)} />
      )}
    </div>
  );
}
