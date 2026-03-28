"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatPercent } from "@/lib/trs-calculations";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function ProductionPage() {
  const [entries, setEntries] = useState<any[]>([]);
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
      const res = await fetch(`/api/production?${params}`);
      setEntries(await res.json());
      setLoading(false);
    }
    load();
  }, [filterLine, filterFrom, filterTo]);

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "info" | "success" | "danger" | "warning"> = {
      DRAFT: "default",
      SUBMITTED: "info",
      VALIDATED: "success",
      REJECTED: "danger",
    };
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      SUBMITTED: "Soumis",
      VALIDATED: "Validé",
      REJECTED: "Rejeté",
    };
    return <Badge variant={map[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const oeeColor = (v: number | null) => {
    if (v == null) return "text-slate-400";
    if (v >= 0.85) return "text-emerald-600 font-semibold";
    if (v >= 0.65) return "text-amber-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const columns: Column<any>[] = [
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date, accessor: (r) => formatDate(r.date) },
    { key: "line", header: "Ligne", sortable: true, sortValue: (r) => r.line?.name || "", accessor: (r) => r.line?.code },
    { key: "product", header: "Produit", accessor: (r) => r.product?.name },
    { key: "lot", header: "Lot", accessor: (r) => r.lot },
    { key: "shift", header: "Shift", accessor: (r) => r.shift || "—" },
    { key: "qty", header: "Qté prod.", sortable: true, sortValue: (r) => r.quantityProduced, accessor: (r) => r.quantityProduced?.toLocaleString("fr-FR") },
    {
      key: "oee", header: "TRS", sortable: true, sortValue: (r) => r.oee || 0,
      accessor: (r) => <span className={oeeColor(r.oee)}>{r.oee != null ? formatPercent(r.oee) : "—"}</span>,
    },
    { key: "status", header: "Statut", accessor: (r) => statusBadge(r.status) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saisie Production</h1>
          <p className="text-sm text-slate-500">Gestion des données de production</p>
        </div>
        <Link href="/production/new">
          <Button><Plus className="h-4 w-4" /> Nouvelle saisie</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
        <div className="w-full sm:w-48">
          <Select options={lines} placeholder="Toutes les lignes" value={filterLine} onChange={(e) => setFilterLine(e.target.value)} />
        </div>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full sm:w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full sm:w-40" />
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
            (row.lot || "").toLowerCase().includes(q) ||
            (row.product?.name || "").toLowerCase().includes(q) ||
            (row.line?.name || "").toLowerCase().includes(q)
          }
        />
      )}
    </div>
  );
}
