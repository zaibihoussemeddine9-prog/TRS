"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export default function AdminCausesPage() {
  const [causes, setCauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/causes").then((r) => r.json()).then((data) => { setCauses(data); setLoading(false); });
  }, []);

  const columns: Column<any>[] = [
    { key: "code", header: "Code", sortable: true, sortValue: (r) => r.code, accessor: (r) => r.code },
    { key: "name", header: "Cause", sortable: true, sortValue: (r) => r.name, accessor: (r) => r.name },
    { key: "type", header: "Type", accessor: (r) => (
      <Badge variant={r.type === "PLANNED" ? "info" : "danger"}>
        {r.type === "PLANNED" ? "Planifié" : "Non planifié"}
      </Badge>
    )},
    { key: "resp", header: "Responsabilité", accessor: (r) => r.responsibility },
    { key: "subCauses", header: "Sous-causes", accessor: (r) => (
      <div className="flex flex-wrap gap-1">
        {r.subCauses?.map((sc: any) => <Badge key={sc.id} variant="default">{sc.name}</Badge>)}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Causes d'arrêt</h1>
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <DataTable data={causes} columns={columns} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)} />
      )}
    </div>
  );
}
