"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { Plus } from "lucide-react";

interface DowntimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  type: string;
  description: string | null;
  responsibility: string;
  status: string;
  line: { name: string; code: string };
  cause: { name: string };
  subCause: { name: string } | null;
  shift: { name: string } | null;
}

export default function DowntimesPage() {
  const [entries, setEntries] = useState<DowntimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<{ value: string; label: string }[]>([]);
  const [filterLine, setFilterLine] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  useEffect(() => {
    fetch("/api/lines").then((r) => r.json()).then((data) =>
      setLines(data.map((l: any) => ({ value: l.id, label: l.name })))
    );
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterLine) params.set("lineId", filterLine);
      if (filterFrom) params.set("dateFrom", filterFrom);
      if (filterTo) params.set("dateTo", filterTo);
      const res = await fetch(`/api/downtimes?${params}`);
      setEntries(await res.json());
      setLoading(false);
    }
    load();
  }, [filterLine, filterFrom, filterTo]);

  const typeBadge = (type: string) => (
    <Badge variant={type === "PLANNED" ? "info" : "danger"}>
      {type === "PLANNED" ? "Planifié" : "Non planifié"}
    </Badge>
  );

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "warning" | "success" | "info"> = {
      OPEN: "danger" as any,
      IN_PROGRESS: "warning",
      RESOLVED: "success",
      CLOSED: "default",
    };
    return <Badge variant={map[status] || "default"}>{status}</Badge>;
  };

  const respLabels: Record<string, string> = {
    PRODUCTION: "Production",
    MAINTENANCE: "Maintenance",
    QUALITE: "Qualité",
    LOGISTIQUE: "Logistique",
    AUTRE: "Autre",
  };

  const columns: Column<DowntimeEntry>[] = [
    { key: "date", header: "Début", sortable: true, sortValue: (r) => r.startTime, accessor: (r) => formatDateTime(r.startTime) },
    { key: "line", header: "Ligne", accessor: (r) => r.line.code },
    { key: "type", header: "Type", accessor: (r) => typeBadge(r.type) },
    { key: "cause", header: "Cause", accessor: (r) => r.cause.name },
    { key: "subCause", header: "Sous-cause", accessor: (r) => r.subCause?.name || "—" },
    { key: "duration", header: "Durée (min)", sortable: true, sortValue: (r) => r.duration || 0, accessor: (r) => r.duration ? Math.round(r.duration) : "En cours" },
    { key: "resp", header: "Responsabilité", accessor: (r) => respLabels[r.responsibility] || r.responsibility },
    { key: "status", header: "Statut", accessor: (r) => statusBadge(r.status) },
    {
      key: "actions",
      header: "",
      accessor: (r) => (
        <Link href={`/downtimes/${r.id}`} className="text-sm text-blue-600 hover:underline">
          Détails
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suivi des Arrêts</h1>
          <p className="text-sm text-slate-500">Gestion et traçabilité des arrêts de ligne</p>
        </div>
        <Link href="/downtimes/new">
          <Button><Plus className="h-4 w-4" /> Nouvel arrêt</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select options={lines} placeholder="Toutes les lignes" value={filterLine} onChange={(e) => setFilterLine(e.target.value)} />
        </div>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-40" />
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
            row.cause.name.toLowerCase().includes(q) ||
            row.line.name.toLowerCase().includes(q) ||
            (row.description || "").toLowerCase().includes(q)
          }
        />
      )}
    </div>
  );
}
