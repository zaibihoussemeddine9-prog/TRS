"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatPercent } from "@/lib/trs-calculations";
import { Plus, Pencil, CheckCircle } from "lucide-react";

const FAMILIES = [
  { value: "Antibiotiques", label: "Antibiotiques" },
  { value: "Antalgiques", label: "Antalgiques" },
  { value: "Anti-inflammatoires", label: "Anti-inflammatoires" },
  { value: "Gastro", label: "Gastro-ent\u00e9rologie" },
  { value: "Sirops", label: "Sirops" },
  { value: "Dermatologie", label: "Dermatologie" },
  { value: "Cardiovasculaire", label: "Cardiovasculaire" },
  { value: "Autre", label: "Autre" },
];

const FORMS = [
  { value: "Comprim\u00e9", label: "Comprim\u00e9" },
  { value: "G\u00e9lule", label: "G\u00e9lule" },
  { value: "Sirop", label: "Sirop" },
  { value: "Pommade", label: "Pommade" },
  { value: "Cr\u00e8me", label: "Cr\u00e8me" },
  { value: "Solution", label: "Solution" },
  { value: "Injectable", label: "Injectable" },
  { value: "Autre", label: "Autre" },
];

const EMPTY = {
  code: "", name: "", family: "", form: "", dosage: "", unitsPerPack: "",
  nominalSpeed: "", targetOEE: "", targetRejectRate: "", standardLotSize: "",
  formatChangeTime: "", cleaningTime: "", comments: "", active: true,
};

export default function AdminProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/products?all=true"); if (r.ok) setProducts(await r.json()); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditingId(null); setForm(EMPTY); setError(""); setSuccess(""); setShowModal(true); }

  function openEdit(p: any) {
    setEditingId(p.id);
    setForm({
      code: p.code, name: p.name, family: p.family || "", form: p.form || "",
      dosage: p.dosage || "", unitsPerPack: p.unitsPerPack?.toString() || "",
      nominalSpeed: p.nominalSpeed?.toString() || "",
      targetOEE: p.targetOEE ? (p.targetOEE * 100).toFixed(0) : "",
      targetRejectRate: p.targetRejectRate ? (p.targetRejectRate * 100).toFixed(1) : "",
      standardLotSize: p.standardLotSize?.toString() || "",
      formatChangeTime: p.formatChangeTime?.toString() || "",
      cleaningTime: p.cleaningTime?.toString() || "",
      comments: p.comments || "", active: p.active,
    });
    setError(""); setSuccess(""); setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.code.trim()) { setError("Nom et code requis"); return; }
    setSubmitting(true); setError("");
    try {
      const payload = {
        ...(editingId && { id: editingId }),
        code: form.code.trim().toUpperCase(), name: form.name.trim(),
        family: form.family || null, form: form.form || null, dosage: form.dosage || null,
        unitsPerPack: form.unitsPerPack ? Number(form.unitsPerPack) : null,
        nominalSpeed: form.nominalSpeed ? Number(form.nominalSpeed) : null,
        targetOEE: form.targetOEE ? Number(form.targetOEE) / 100 : null,
        targetRejectRate: form.targetRejectRate ? Number(form.targetRejectRate) / 100 : null,
        standardLotSize: form.standardLotSize ? Number(form.standardLotSize) : null,
        formatChangeTime: form.formatChangeTime ? Number(form.formatChangeTime) : null,
        cleaningTime: form.cleaningTime ? Number(form.cleaningTime) : null,
        comments: form.comments || null, active: form.active,
        userId: session?.user?.id,
      };
      const res = await fetch("/api/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setSuccess(editingId ? "Produit modifi\u00e9" : "Produit cr\u00e9\u00e9"); setShowModal(false); await load(); setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Erreur r\u00e9seau"); } finally { setSubmitting(false); }
  }

  const columns: Column<any>[] = [
    { key: "code", header: "Code", sortable: true, sortValue: (r) => r.code, accessor: (r) => <span className="font-mono font-semibold">{r.code}</span> },
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, accessor: (r) => r.name },
    { key: "family", header: "Famille", accessor: (r) => r.family || "\u2014" },
    { key: "form", header: "Forme", accessor: (r) => r.form || "\u2014" },
    { key: "speed", header: "Cadence", sortable: true, sortValue: (r) => r.nominalSpeed || 0, accessor: (r) => r.nominalSpeed ? `${r.nominalSpeed} u/min` : "\u2014" },
    { key: "oee", header: "TRS cible", accessor: (r) => r.targetOEE != null ? formatPercent(r.targetOEE) : "\u2014" },
    { key: "active", header: "Statut", accessor: (r) => <Badge variant={r.active ? "success" : "default"}>{r.active ? "Actif" : "Inactif"}</Badge> },
    { key: "actions", header: "", accessor: (r) => <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button> },
  ];

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Produits</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Cr\u00e9er un produit</Button>
      </div>
      {success && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4" />{success}</div>}
      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <DataTable data={products} columns={columns} pageSize={15} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)} />
      )}
      <Modal open={showModal} onClose={() => { if (!submitting) setShowModal(false); }} title={editingId ? "Modifier le produit" : "Cr\u00e9er un produit"}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Code *" value={form.code} onChange={(e) => set("code", e.target.value)} disabled={submitting} />
            <Input label="Nom *" value={form.name} onChange={(e) => set("name", e.target.value)} disabled={submitting} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Famille" options={FAMILIES} placeholder="S\u00e9lectionner" value={form.family} onChange={(e) => set("family", e.target.value)} disabled={submitting} />
            <Select label="Forme" options={FORMS} placeholder="S\u00e9lectionner" value={form.form} onChange={(e) => set("form", e.target.value)} disabled={submitting} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Dosage" value={form.dosage} onChange={(e) => set("dosage", e.target.value)} disabled={submitting} />
            <Input label="Unit\u00e9s/pack" type="number" value={form.unitsPerPack} onChange={(e) => set("unitsPerPack", e.target.value)} disabled={submitting} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Cadence nominale (u/min)" type="number" value={form.nominalSpeed} onChange={(e) => set("nominalSpeed", e.target.value)} disabled={submitting} />
            <Input label="TRS cible (%)" type="number" step="1" value={form.targetOEE} onChange={(e) => set("targetOEE", e.target.value)} disabled={submitting} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Taux rejet cible (%)" type="number" step="0.1" value={form.targetRejectRate} onChange={(e) => set("targetRejectRate", e.target.value)} disabled={submitting} />
            <Input label="Taille lot standard" type="number" value={form.standardLotSize} onChange={(e) => set("standardLotSize", e.target.value)} disabled={submitting} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Changement format (min)" type="number" value={form.formatChangeTime} onChange={(e) => set("formatChangeTime", e.target.value)} disabled={submitting} />
            <Input label="Nettoyage (min)" type="number" value={form.cleaningTime} onChange={(e) => set("cleaningTime", e.target.value)} disabled={submitting} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Commentaires</label>
            <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={2} value={form.comments} onChange={(e) => set("comments", e.target.value)} disabled={submitting} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => set("active", true)} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium ${form.active ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500" : "bg-slate-100 text-slate-500"}`}>Actif</button>
            <button type="button" onClick={() => set("active", false)} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium ${!form.active ? "bg-red-100 text-red-700 ring-2 ring-red-500" : "bg-slate-100 text-slate-500"}`}>Inactif</button>
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingId ? "Enregistrer" : "Cr\u00e9er"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
