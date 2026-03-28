"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";

interface RefItem {
  id: string;
  type: string;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

const SECTIONS = [
  { type: "FAMILY", title: "Familles de produit", description: "Classification des produits par famille thérapeutique" },
  { type: "FORM", title: "Formes galéniques", description: "Formes pharmaceutiques des produits" },
  { type: "LABORATORY", title: "Laboratoires", description: "Laboratoires fabricants" },
];

export default function ReferentielsPage() {
  const [items, setItems] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalType, setModalType] = useState("");
  const [form, setForm] = useState({ value: "", label: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fam, frm, lab] = await Promise.all([
        fetch("/api/reference-lists?type=FAMILY").then(r => r.json()),
        fetch("/api/reference-lists?type=FORM").then(r => r.json()),
        fetch("/api/reference-lists?type=LABORATORY").then(r => r.json()),
      ]);
      setItems([...fam, ...frm, ...lab]);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate(type: string) {
    setEditingId(null);
    setModalType(type);
    setForm({ value: "", label: "" });
    setError("");
    setShowModal(true);
  }

  function openEdit(item: RefItem) {
    setEditingId(item.id);
    setModalType(item.type);
    setForm({ value: item.value, label: item.label });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.value.trim() || !form.label.trim()) { setError("Valeur et libellé requis"); return; }
    setSubmitting(true); setError("");
    try {
      const payload = editingId
        ? { id: editingId, value: form.value.trim(), label: form.label.trim() }
        : { type: modalType, value: form.value.trim(), label: form.label.trim() };
      const res = await fetch("/api/reference-lists", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setSuccess(editingId ? "Modifié" : "Créé");
      setShowModal(false); await load(); setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Erreur réseau"); } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer cet élément ?")) return;
    const res = await fetch("/api/reference-lists", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) { setSuccess("Supprimé"); await load(); setTimeout(() => setSuccess(""), 4000); }
    else { setError(data.error || "Erreur"); setTimeout(() => setError(""), 6000); }
  }

  const sectionTitle = SECTIONS.find(s => s.type === modalType)?.title || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Référentiels</h1>
        <p className="text-sm text-slate-500">Configuration des listes de valeurs</p>
      </div>

      {success && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4" />{success}</div>}
      {error && !showModal && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : (
        SECTIONS.map((section) => {
          const sectionItems = items.filter(i => i.type === section.type);
          return (
            <Card key={section.type}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{section.title}</h2>
                    <p className="text-xs text-slate-500">{section.description}</p>
                  </div>
                  <Button size="sm" onClick={() => openCreate(section.type)}><Plus className="h-4 w-4" /> Ajouter</Button>
                </div>
              </CardHeader>
              <CardContent>
                {sectionItems.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">Aucune valeur configurée</p>
                ) : (
                  <div className="space-y-2">
                    {sectionItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2">
                        <div>
                          <span className="font-medium">{item.label}</span>
                          {item.value !== item.label && <span className="ml-2 text-xs text-slate-400 font-mono">{item.value}</span>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <Modal open={showModal} onClose={() => { if (!submitting) setShowModal(false); }} title={editingId ? `Modifier — ${sectionTitle}` : `Ajouter — ${sectionTitle}`}>
        <div className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <Input label="Libellé *" placeholder="Ex: Antibiotiques" value={form.label} onChange={(e) => setForm(p => ({ ...p, label: e.target.value, ...(editingId ? {} : { value: e.target.value }) }))} disabled={submitting} />
          <Input label="Valeur technique" placeholder="Identique au libellé si vide" value={form.value} onChange={(e) => setForm(p => ({ ...p, value: e.target.value }))} disabled={submitting} />
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingId ? "Enregistrer" : "Ajouter"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
