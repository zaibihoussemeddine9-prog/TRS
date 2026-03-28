"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { Plus, Eye } from "lucide-react";

export default function ProductionPage() {
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

  const columns: Column<any>[] = [
    { key: "lot", header: "N° Lot", sortable: true, sortValue: (r) => r.lot, accessor: (r) => <span className="font-mono font-semibold">{r.lot}</span> },
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date, accessor: (r) => formatDate(r.date) },
    { key: "line", header: "Ligne", accessor: (r) => r.line?.name || "—" },
    { key: "product", header: "Produit", accessor: (r) => r.product?.name || "—" },
    { key: "shift", header: "Shift", accessor: (r) => r.shift?.name || "—" },
    { key: "status", header: "Statut", accessor: (r) => <Badge variant={r.status === "OPEN" ? "success" : "default"}>{r.status === "OPEN" ? "Ouvert" : "Clôturé"}</Badge> },
    { key: "downtimes", header: "Arrêts", accessor: (r) => r._count?.downtimeEvents || 0 },
    { key: "decl", header: "Saisies", accessor: (r) => r._count?.productionDeclarations || 0 },
    { key: "detail", header: "", accessor: (r) => (
      <Link href={`/production/${r.id}`}>
        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /> Voir la fiche</Button>
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production</h1>
          <p className="text-sm text-slate-500">Lots de production</p>
        </div>
        <Link href="/production/new"><Button><Plus className="h-4 w-4" /> Nouveau lot</Button></Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
        <div className="w-full sm:w-48"><Select options={lines} placeholder="Toutes les lignes" value={filterLine} onChange={(e) => setFilterLine(e.target.value)} /></div>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full sm:w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full sm:w-40" />
      </div>
      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <DataTable data={batches} columns={columns} pageSize={15} searchable searchFn={(r, q) => r.lot.toLowerCase().includes(q) || (r.product?.name || "").toLowerCase().includes(q)} />
      )}
    </div>
  );
}
