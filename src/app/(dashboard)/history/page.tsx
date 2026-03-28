"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FileDown } from "lucide-react";

export default function HistoryPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<{ value: string; label: string }[]>([]);
  const [filterLine, setFilterLine] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  useEffect(() => {
    fetch("/api/lines").then((r) => r.json()).then((data) =>
      setLines(data.map((l: any) => ({ value: l.id, label: l.name })))
    ).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterLine) params.set("lineId", filterLine);
    if (filterFrom) params.set("dateFrom", filterFrom);
    if (filterTo) params.set("dateTo", filterTo);
    fetch(`/api/production?${params}`).then((r) => r.json()).then(setBatches).catch(() => {}).finally(() => setLoading(false));
  }, [filterLine, filterFrom, filterTo]);

  function exportCSV() {
    const headers = ["Date", "Lot", "Ligne", "Produit", "Statut", "Arrêts", "Shifts"];
    const rows = batches.map((b: any) => [
      formatDate(b.date), b.lot, b.line?.name, b.product?.name, b.status,
      b._count?.downtimeEvents || 0, b._count?.shiftProductions || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `historique_lots_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<any>[] = [
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date, accessor: (r) => formatDate(r.date) },
    { key: "lot", header: "Lot", sortable: true, sortValue: (r) => r.lot, accessor: (r) => <span className="font-mono">{r.lot}</span> },
    { key: "line", header: "Ligne", accessor: (r) => r.line?.name || "—" },
    { key: "product", header: "Produit", accessor: (r) => r.product?.name || "—" },
    { key: "status", header: "Statut", accessor: (r) => <Badge variant={r.status === "OPEN" ? "success" : "default"}>{r.status === "OPEN" ? "Ouvert" : "Clôturé"}</Badge> },
    { key: "downtimes", header: "Arrêts", accessor: (r) => r._count?.downtimeEvents || 0 },
    { key: "shifts", header: "Shifts", accessor: (r) => r._count?.shiftProductions || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique</h1>
          <p className="text-sm text-slate-500">Consultation des lots de production</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><FileDown className="h-4 w-4" /> Export CSV</Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
        <div className="w-full sm:w-48"><Select options={lines} placeholder="Toutes les lignes" value={filterLine} onChange={(e) => setFilterLine(e.target.value)} /></div>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full sm:w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full sm:w-40" />
      </div>
      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <DataTable data={batches} columns={columns} pageSize={20} searchable searchFn={(r, q) => (r.lot || "").toLowerCase().includes(q) || (r.product?.name || "").toLowerCase().includes(q) || (r.line?.name || "").toLowerCase().includes(q)} />
      )}
    </div>
  );
}
