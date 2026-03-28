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

interface LineData {
  id: string;
  code: string;
  name: string;
  workshopId: string;
  lineType: string | null;
  active: boolean;
  workshop: { name: string; site: { name: string } };
}

interface Workshop {
  id: string;
  name: string;
  code: string;
  site: { name: string };
}

const LINE_TYPES = [
  { value: "blistereuse", label: "Blistéreuse" },
  { value: "encartonneuse", label: "Encartonneuse" },
  { value: "remplisseuse_sirop", label: "Remplisseuse sirop" },
  { value: "remplisseuse_tube", label: "Remplisseuse tube" },
  { value: "etuyeuse", label: "Étuyeuse" },
  { value: "encaisseuse", label: "Encaisseuse" },
  { value: "palettiseur", label: "Palettiseur" },
  { value: "autre", label: "Autre" },
];

const EMPTY_FORM = { code: "", name: "", workshopId: "", lineType: "", active: true };

export default function AdminLinesPage() {
  const { data: session } = useSession();
  const [lines, setLines] = useState<LineData[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadLines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lines?all=true");
      if (res.ok) setLines(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadLines();
    fetch("/api/workshops").then((r) => r.json()).then(setWorkshops).catch(() => setWorkshops([]));
  }, [loadLines]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEdit(line: LineData) {
    setEditingId(line.id);
    setForm({
      code: line.code,
      name: line.name,
      workshopId: line.workshopId,
      lineType: line.lineType || "",
      active: line.active,
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("Le nom est obligatoire"); return; }
    if (!form.code.trim()) { setError("Le code est obligatoire"); return; }
    if (!form.workshopId) { setError("L'atelier est obligatoire"); return; }

    setSubmitting(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const payload = {
        ...(editingId && { id: editingId }),
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        workshopId: form.workshopId,
        lineType: form.lineType || null,
        active: form.active,
        userId: session?.user?.id || null,
      };

      const res = await fetch("/api/lines", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : { error: "Réponse serveur invalide" };

      if (!res.ok) { setError(data.error || `Erreur ${res.status}`); return; }

      setSuccess(editingId ? `Ligne "${payload.name}" modifiée` : `Ligne "${payload.name}" créée`);
      setShowModal(false);
      await loadLines();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Délai d'attente dépassé");
      } else {
        setError(err instanceof Error ? err.message : "Erreur inattendue");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const columns: Column<LineData>[] = [
    { key: "code", header: "Code", sortable: true, sortValue: (r) => r.code, accessor: (r) => <span className="font-mono font-semibold text-slate-900">{r.code}</span> },
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, accessor: (r) => r.name },
    { key: "workshop", header: "Atelier", accessor: (r) => (
      <div>
        <p>{r.workshop?.name}</p>
        <p className="text-xs text-slate-500">{r.workshop?.site?.name}</p>
      </div>
    )},
    { key: "type", header: "Type", accessor: (r) => {
      if (!r.lineType) return <span className="text-slate-400">—</span>;
      const found = LINE_TYPES.find((t) => t.value === r.lineType);
      return <Badge variant="info">{found?.label || r.lineType}</Badge>;
    }},
    { key: "active", header: "Statut", accessor: (r) => <Badge variant={r.active ? "success" : "default"}>{r.active ? "Actif" : "Inactif"}</Badge> },
    { key: "actions", header: "", accessor: (r) => (
      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
        <Pencil className="h-4 w-4" /><span className="hidden sm:inline">Modifier</span>
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lignes de conditionnement</h1>
          <p className="text-sm text-slate-500">{lines.length} ligne{lines.length > 1 ? "s" : ""} — Les cadences et temps standards se configurent dans Produits</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Créer une ligne</Button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />{success}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : (
        <DataTable data={lines} columns={columns} pageSize={15} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || (r.workshop?.name || "").toLowerCase().includes(q)} />
      )}

      <Modal open={showModal} onClose={() => { if (!submitting) setShowModal(false); }} title={editingId ? "Modifier la ligne" : "Créer une ligne"}>
        <div className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Code ligne *" placeholder="ex: BL01" value={form.code} onChange={(e) => updateField("code", e.target.value)} disabled={submitting} />
            <Input label="Nom ligne *" placeholder="ex: Ligne Blistéreuse 1" value={form.name} onChange={(e) => updateField("name", e.target.value)} disabled={submitting} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Atelier *" options={workshops.map((w) => ({ value: w.id, label: `${w.name} — ${w.site.name}` }))} placeholder="Sélectionner" value={form.workshopId} onChange={(e) => updateField("workshopId", e.target.value)} disabled={submitting} />
            <Select label="Type de ligne" options={LINE_TYPES} placeholder="Sélectionner" value={form.lineType} onChange={(e) => updateField("lineType", e.target.value)} disabled={submitting} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Statut</label>
            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={() => updateField("active", true)} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${form.active ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500" : "bg-slate-100 text-slate-500"}`}>Actif</button>
              <button type="button" onClick={() => updateField("active", false)} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${!form.active ? "bg-red-100 text-red-700 ring-2 ring-red-500" : "bg-slate-100 text-slate-500"}`}>Inactif</button>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingId ? "Enregistrer" : "Créer la ligne"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
