"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function DowntimesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/downtimes");
      setEntries(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  const columns: Column<any>[] = [
    { key: "start", header: "D\u00e9but", sortable: true, sortValue: (r) => r.startTime || "", accessor: (r) => r.startTime ? formatDateTime(r.startTime) : "\u2014" },
    { key: "lot", header: "Lot", accessor: (r) => r.batch?.lot || "\u2014" },
    { key: "line", header: "Ligne", accessor: (r) => r.batch?.line?.code || "\u2014" },
    { key: "type", header: "Type", accessor: (r) => r.downtimeType ? <Badge variant="info">{r.downtimeType.name}</Badge> : "\u2014" },
    { key: "duration", header: "Dur\u00e9e (min)", sortable: true, sortValue: (r) => r.duration || 0, accessor: (r) => r.duration ? Math.round(r.duration) : "En cours" },
    { key: "desc", header: "Description", accessor: (r) => r.description || "\u2014" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suivi des Arr\u00eats</h1>
          <p className="text-sm text-slate-500">Gestion et tra\u00e7abilit\u00e9 des arr\u00eats de ligne</p>
        </div>
        <Link href="/downtimes/new">
          <Button><Plus className="h-4 w-4" /> Nouvel arr\u00eat</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <DataTable
          data={entries}
          columns={columns}
          pageSize={15}
          searchable
          searchFn={(row, q) =>
            (row.downtimeType?.name || "").toLowerCase().includes(q) ||
            (row.batch?.lot || "").toLowerCase().includes(q) ||
            (row.description || "").toLowerCase().includes(q)
          }
        />
      )}
    </div>
  );
}
