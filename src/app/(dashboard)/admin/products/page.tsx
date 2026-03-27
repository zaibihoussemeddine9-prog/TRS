"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((data) => { setProducts(data); setLoading(false); });
  }, []);

  const columns: Column<any>[] = [
    { key: "code", header: "Code", sortable: true, sortValue: (r) => r.code, accessor: (r) => r.code },
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, accessor: (r) => r.name },
    { key: "family", header: "Famille", accessor: (r) => r.family || "—" },
    { key: "formats", header: "Formats", accessor: (r) => (
      <div className="flex flex-wrap gap-1">
        {r.formats?.map((f: any) => <Badge key={f.id} variant="info">{f.name}</Badge>)}
      </div>
    )},
    { key: "active", header: "Actif", accessor: (r) => r.active ? "Oui" : "Non" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Produits & Formats</h1>
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <DataTable data={products} columns={columns} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)} />
      )}
    </div>
  );
}
