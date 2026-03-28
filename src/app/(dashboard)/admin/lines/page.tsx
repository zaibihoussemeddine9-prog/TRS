"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Pencil, CheckCircle } from "lucide-react";

const LINE_TYPES = [
  { value: "blistereuse", label: "Blist\u00e9reuse" },
  { value: "encartonneuse", label: "Encartonneuse" },
  { value: "remplisseuse", label: "Remplisseuse" },
  { value: "autre", label: "Autre" },
];

const EMPTY = { code: "", name: "", lineType: "", active: true };

export default function AdminLinesPage() {
  const { data: session } = useSession();
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/lines?all=true"); if (r.ok) setLines(await r.json()); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditingId(null); setForm(EMPTY); setError(""); setSuccess(""); setShowModal(true); }
  function openEdit(l: any) { setEditingId(l.id); setForm({ code: l.code, name: l.name, lineType: l.lineType || "", active: l.active }); setError(""); setSuccess(""); setShowModal(true); }

  async function handleSubmit() {
    if (!form.name.trim() || !form.code.trim()) { setError("Nom et code requis"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/lines", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(editingId && { id: editingId }), name: form.name.trim(), code: form.code.trim().toUpperCase(), lineType: form.lineType || null, active: form.active, userId: session?.user?.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setSuccess(editingId ? "Ligne modifi\u00e9e" : "Ligne cr\u00e9\u00e9e"); setShowModal(false); await load(); setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Erreur r\u00e9seau"); } finally { setSubmitting(false); }
  }

  const columns: Column<any>[] = [
    { key: "code", header: "Code", sortable: true, sortValue: (r) => r.code, accessor: (r) => <span className="font-mono font-semibold">{r.code}</span> },
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, accessor: (r) => r.name },
    { key: "type", header: "Type", accessor: (r) => r.lineType ? <Badge variant="info">{LINE_TYPES.find(t => t.value === r.lineType)?.label || r.lineType}</Badge> : "\u2014" },
    { key: "active", header: "Statut", accessor: (r) => <Badge variant={r.active ? "success" : "default"}>{r.active ? "Actif" : "Inactif"}</Badge> },
    { key: "actions", header: "", accessor: (r) => <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Lignes</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Cr\u00e9er une ligne</Button>
      </div>
      {success && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4" />{success}</div>}
      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <DataTable data={lines} columns={columns} pageSize={15} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)} />
      )}
      <Modal open={showModal} onClose={() => { if (!submitting) setShowModal(false); }} title={editingId ? "Modifier la ligne" : "Cr\u00e9er une ligne"}>
        <div className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Code *" value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} disabled={submitting} />
            <Input label="Nom *" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} disabled={submitting} />
          </div>
          <Select label="Type" options={LINE_TYPES} placeholder="S\u00e9lectionner" value={form.lineType} onChange={(e) => setForm(p => ({ ...p, lineType: e.target.value }))} disabled={submitting} />
          <div className="flex gap-3">
            <button type="button" onClick={() => setForm(p => ({ ...p, active: true }))} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium ${form.active ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500" : "bg-slate-100 text-slate-500"}`}>Actif</button>
            <button type="button" onClick={() => setForm(p => ({ ...p, active: false }))} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium ${!form.active ? "bg-red-100 text-red-700 ring-2 ring-red-500" : "bg-slate-100 text-slate-500"}`}>Inactif</button>
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
