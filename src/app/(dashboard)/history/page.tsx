"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { formatPercent } from "@/lib/trs-calculations";
import { FileDown } from "lucide-react";

export default function HistoryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<{ value: string; label: string }[]>([]);
  const [products, setProducts] = useState<{ value: string; label: string }[]>([]);
  const [filterLine, setFilterLine] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/lines").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([l, p]) => {
      setLines(l.map((x: any) => ({ value: x.id, label: x.name })));
      setProducts(p.map((x: any) => ({ value: x.id, label: x.name })));
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterLine) params.set("lineId", filterLine);
      if (filterProduct) params.set("productId", filterProduct);
      if (filterFrom) params.set("dateFrom", filterFrom);
      if (filterTo) params.set("dateTo", filterTo);
      const res = await fetch(`/api/production?${params}`);
      setEntries(await res.json());
      setLoading(false);
    }
    load();
  }, [filterLine, filterProduct, filterFrom, filterTo]);

  function exportCSV() {
    const headers = ["Date", "Ligne", "Produit", "Lot", "Shift", "Qté Produite", "Qté Conforme", "Rejet", "Dispo", "Perf", "Qualité", "TRS", "Statut"];
    const rows = entries.map((e: any) => [
      formatDate(e.date), e.line?.code, e.product?.name, e.lot, e.shift || "",
      e.quantityProduced, e.quantityConform, e.quantityRejected,
      e.availability != null ? (e.availability * 100).toFixed(1) + "%" : "",
      e.performance != null ? (e.performance * 100).toFixed(1) + "%" : "",
      e.quality != null ? (e.quality * 100).toFixed(1) + "%" : "",
      e.oee != null ? (e.oee * 100).toFixed(1) + "%" : "",
      e.status || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historique_production_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<any>[] = [
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date, accessor: (r) => formatDate(r.date) },
    { key: "line", header: "Ligne", sortable: true, sortValue: (r) => r.line?.name || "", accessor: (r) => r.line?.code },
    { key: "product", header: "Produit", accessor: (r) => r.product?.name },
    { key: "lot", header: "Lot", accessor: (r) => r.lot },
    { key: "shift", header: "Shift", accessor: (r) => r.shift || "—" },
    { key: "qty", header: "Qté", sortable: true, sortValue: (r) => r.quantityProduced, accessor: (r) => r.quantityProduced?.toLocaleString("fr-FR") },
    { key: "reject", header: "Rejet", accessor: (r) => r.quantityRejected },
    { key: "dispo", header: "Dispo", sortable: true, sortValue: (r) => r.availability || 0, accessor: (r) => r.availability != null ? formatPercent(r.availability) : "—" },
    { key: "perf", header: "Perf", sortable: true, sortValue: (r) => r.performance || 0, accessor: (r) => r.performance != null ? formatPercent(r.performance) : "—" },
    { key: "qual", header: "Qualité", sortable: true, sortValue: (r) => r.quality || 0, accessor: (r) => r.quality != null ? formatPercent(r.quality) : "—" },
    {
      key: "oee", header: "TRS", sortable: true, sortValue: (r) => r.oee || 0,
      accessor: (r) => {
        if (r.oee == null) return "—";
        const v = r.oee >= 0.85 ? "success" : r.oee >= 0.65 ? "warning" : "danger";
        return <Badge variant={v}>{formatPercent(r.oee)}</Badge>;
      },
    },
    { key: "status", header: "Statut", accessor: (r) => <Badge variant={r.status === "VALIDATED" ? "success" : "default"}>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique & Reporting</h1>
          <p className="text-sm text-slate-500">Consultation détaillée des données de production</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <FileDown className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
        <div className="w-full sm:w-48"><Select options={lines} placeholder="Toutes les lignes" value={filterLine} onChange={(e) => setFilterLine(e.target.value)} /></div>
        <div className="w-full sm:w-48"><Select options={products} placeholder="Tous les produits" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} /></div>
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
          pageSize={20}
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
