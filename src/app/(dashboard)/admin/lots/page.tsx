"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

const EMPTY = { lot: "", lineId: "", productId: "", shiftId: "", date: "", orderNumber: "", comment: "", status: "OPEN" };

export default function AdminLotsPage() {
  const { data: session } = useSession();
  const [batches, setBatches] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, lRes, pRes, sRes] = await Promise.all([
        fetch("/api/production"), fetch("/api/lines"), fetch("/api/products"), fetch("/api/shifts"),
      ]);
      if (bRes.ok) setBatches(await bRes.json());
      if (lRes.ok) setLines(await lRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (sRes.ok) setShifts(await sRes.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditingId(null); setForm(EMPTY); setError(""); setSuccess(""); setShowModal(true); }
  function openEdit(b: any) {
    setEditingId(b.id);
    setForm({
      lot: b.lot, lineId: b.lineId, productId: b.productId, shiftId: b.shiftId || "",
      date: new Date(b.date).toISOString().split("T")[0],
      orderNumber: b.orderNumber || "", comment: b.comment || "", status: b.status,
    });
    setError(""); setSuccess(""); setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.lot.trim() || !form.lineId || !form.productId || !form.date || !form.shiftId) {
      setError("Lot, ligne, produit, date et shift sont requis"); return;
    }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/production", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(editingId && { id: editingId }), ...form, userId: session?.user?.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setSuccess(editingId ? "Lot modifié" : "Lot créé");
      setShowModal(false); await load(); setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Erreur réseau"); } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce lot et tous ses arrêts/productions associés ?")) return;
    try {
      const res = await fetch("/api/production", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { setSuccess("Lot supprimé"); await load(); setTimeout(() => setSuccess(""), 4000); }
    } catch { setError("Erreur suppression"); }
  }

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const columns: Column<any>[] = [
    { key: "lot", header: "N° Lot", sortable: true, sortValue: (r) => r.lot, accessor: (r) => <span className="font-mono font-semibold">{r.lot}</span> },
    { key: "line", header: "Ligne", accessor: (r) => r.line?.name || "—" },
    { key: "product", header: "Produit", accessor: (r) => r.product?.name || "—" },
    { key: "shift", header: "Shift", accessor: (r) => r.shift?.name || "—" },
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date, accessor: (r) => formatDate(r.date) },
    { key: "status", header: "Statut", accessor: (r) => <Badge variant={r.status === "OPEN" ? "success" : "default"}>{r.status === "OPEN" ? "Ouvert" : "Clôturé"}</Badge> },
    { key: "downtimes", header: "Arrêts", accessor: (r) => r._count?.downtimeEvents || 0 },
    { key: "decl", header: "Saisies", accessor: (r) => r._count?.productionDeclarations || 0 },
    { key: "actions", header: "", accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lots de production</h1>
          <p className="text-sm text-slate-500">{batches.length} lot{batches.length > 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Créer un lot</Button>
      </div>
      {success && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4" />{success}</div>}
      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <DataTable data={batches} columns={columns} pageSize={15} searchable searchFn={(r, q) => r.lot.toLowerCase().includes(q) || (r.line?.name || "").toLowerCase().includes(q) || (r.product?.name || "").toLowerCase().includes(q)} />
      )}
      <Modal open={showModal} onClose={() => { if (!submitting) setShowModal(false); }} title={editingId ? "Modifier le lot" : "Créer un lot"}>
        <div className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="N° Lot *" value={form.lot} onChange={(e) => set("lot", e.target.value)} disabled={submitting} />
            <Input label="Date *" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} disabled={submitting} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Ligne *" options={lines.map((l: any) => ({ value: l.id, label: l.name }))} placeholder="Sélectionner" value={form.lineId} onChange={(e) => set("lineId", e.target.value)} disabled={submitting} />
            <Select label="Produit *" options={products.map((p: any) => ({ value: p.id, label: p.name }))} placeholder="Sélectionner" value={form.productId} onChange={(e) => set("productId", e.target.value)} disabled={submitting} />
          </div>
          <Select label="Shift *" options={shifts.map((s: any) => ({ value: s.id, label: `${s.name} (${s.startTime}–${s.endTime})` }))} placeholder="Sélectionner un shift" value={form.shiftId} onChange={(e) => set("shiftId", e.target.value)} disabled={submitting} />
          <Input label="N° OF / OC" value={form.orderNumber} onChange={(e) => set("orderNumber", e.target.value)} disabled={submitting} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Commentaire</label>
            <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={2} value={form.comment} onChange={(e) => set("comment", e.target.value)} disabled={submitting} />
          </div>
          <Select label="Statut" options={[{ value: "OPEN", label: "Ouvert" }, { value: "CLOSED", label: "Clôturé" }]} value={form.status} onChange={(e) => set("status", e.target.value)} disabled={submitting} />
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingId ? "Enregistrer" : "Créer"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
