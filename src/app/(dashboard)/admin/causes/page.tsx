"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus, Pencil, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";

interface DType { id: string; name: string; code: string; sortOrder: number; active: boolean; }
interface SubCat { id: string; name: string; code: string; sortOrder: number; active: boolean; downtimeTypes: DType[]; }
interface Cat { id: string; name: string; code: string; color: string; sortOrder: number; active: boolean; subCategories: SubCat[]; }

const EMPTY_CAT = { name: "", code: "", color: "#3b82f6" };
const EMPTY_SUB = { name: "", code: "", categoryId: "" };
const EMPTY_TYPE = { name: "", code: "", subCategoryId: "" };

export default function AdminCausesPage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalLevel, setModalLevel] = useState<"category" | "subcategory" | "type">("category");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCat, setFormCat] = useState(EMPTY_CAT);
  const [formSub, setFormSub] = useState(EMPTY_SUB);
  const [formType, setFormType] = useState(EMPTY_TYPE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/causes"); if (r.ok) setCategories(await r.json()); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function openCreateCat() { setModalLevel("category"); setEditingId(null); setFormCat(EMPTY_CAT); setError(""); setShowModal(true); }
  function openCreateSub(categoryId: string) { setModalLevel("subcategory"); setEditingId(null); setFormSub({ ...EMPTY_SUB, categoryId }); setError(""); setShowModal(true); }
  function openCreateType(subCategoryId: string) { setModalLevel("type"); setEditingId(null); setFormType({ ...EMPTY_TYPE, subCategoryId }); setError(""); setShowModal(true); }

  function openEditCat(c: Cat) { setModalLevel("category"); setEditingId(c.id); setFormCat({ name: c.name, code: c.code, color: c.color }); setError(""); setShowModal(true); }
  function openEditSub(s: SubCat, categoryId: string) { setModalLevel("subcategory"); setEditingId(s.id); setFormSub({ name: s.name, code: s.code, categoryId }); setError(""); setShowModal(true); }
  function openEditType(t: DType, subCategoryId: string) { setModalLevel("type"); setEditingId(t.id); setFormType({ name: t.name, code: t.code, subCategoryId }); setError(""); setShowModal(true); }

  async function handleSubmit() {
    let name = "", code = "";
    let payload: Record<string, unknown> = { level: modalLevel, userId: session?.user?.id };

    if (modalLevel === "category") { name = formCat.name; code = formCat.code; payload = { ...payload, name, code, color: formCat.color }; }
    else if (modalLevel === "subcategory") { name = formSub.name; code = formSub.code; payload = { ...payload, name, code, categoryId: formSub.categoryId }; }
    else { name = formType.name; code = formType.code; payload = { ...payload, name, code, subCategoryId: formType.subCategoryId }; }

    if (!name.trim() || !code.trim()) { setError("Nom et code requis"); return; }
    if (editingId) payload.id = editingId;

    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/causes", {
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

  const levelLabels = { category: "catégorie", subcategory: "sous-catégorie", type: "type d'arrêt" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Types d'arrêt</h1>
          <p className="text-sm text-slate-500">Configuration hiérarchique : Catégorie → Sous-catégorie → Type</p>
        </div>
        <Button onClick={openCreateCat}><Plus className="h-4 w-4" /> Nouvelle catégorie</Button>
      </div>

      {success && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4" />{success}</div>}

      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <div className="space-y-3">
          {categories.length === 0 && <p className="py-8 text-center text-slate-500">Aucune catégorie configurée</p>}
          {categories.map((cat) => (
            <Card key={cat.id}>
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50" onClick={() => toggle(cat.id)}>
                <div className="flex items-center gap-3">
                  {expanded.has(cat.id) ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-slate-900">{cat.name}</span>
                  <span className="font-mono text-xs text-slate-500">{cat.code}</span>
                  <Badge variant="default">{cat.subCategories.length} sous-cat.</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditCat(cat); }}><Pencil className="h-4 w-4" /></Button>
              </div>
              {expanded.has(cat.id) && (
                <div className="border-t px-4 pb-3 space-y-2">
                  {cat.subCategories.map((sub) => (
                    <div key={sub.id}>
                      <div className="flex items-center justify-between py-2 pl-8">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggle(sub.id)}>
                          {expanded.has(sub.id) ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                          <span className="text-sm font-medium text-slate-700">{sub.name}</span>
                          <span className="font-mono text-xs text-slate-400">{sub.code}</span>
                          <Badge variant="info">{sub.downtimeTypes.length} types</Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openEditSub(sub, cat.id)}><Pencil className="h-3 w-3" /></Button>
                      </div>
                      {expanded.has(sub.id) && (
                        <div className="pl-16 space-y-1 pb-2">
                          {sub.downtimeTypes.map((dt) => (
                            <div key={dt.id} className="flex items-center justify-between rounded border border-slate-100 px-3 py-1.5 text-sm">
                              <div className="flex items-center gap-2">
                                <span>{dt.name}</span>
                                <span className="font-mono text-xs text-slate-400">{dt.code}</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => openEditType(dt, sub.id)}><Pencil className="h-3 w-3" /></Button>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => openCreateType(sub.id)} className="text-blue-600"><Plus className="h-3 w-3" /> Ajouter un type</Button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pl-8 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => openCreateSub(cat.id)} className="text-blue-600"><Plus className="h-3 w-3" /> Ajouter une sous-catégorie</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => { if (!submitting) setShowModal(false); }} title={editingId ? `Modifier ${levelLabels[modalLevel]}` : `Créer ${levelLabels[modalLevel]}`}>
        <div className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          {modalLevel === "category" && (
            <>
              <Input label="Nom *" value={formCat.name} onChange={(e) => setFormCat((p) => ({ ...p, name: e.target.value }))} disabled={submitting} />
              <Input label="Code *" value={formCat.code} onChange={(e) => setFormCat((p) => ({ ...p, code: e.target.value }))} disabled={submitting} />
              <Input label="Couleur" type="color" value={formCat.color} onChange={(e) => setFormCat((p) => ({ ...p, color: e.target.value }))} disabled={submitting} />
            </>
          )}
          {modalLevel === "subcategory" && (
            <>
              <Input label="Nom *" value={formSub.name} onChange={(e) => setFormSub((p) => ({ ...p, name: e.target.value }))} disabled={submitting} />
              <Input label="Code *" value={formSub.code} onChange={(e) => setFormSub((p) => ({ ...p, code: e.target.value }))} disabled={submitting} />
            </>
          )}
          {modalLevel === "type" && (
            <>
              <Input label="Nom *" value={formType.name} onChange={(e) => setFormType((p) => ({ ...p, name: e.target.value }))} disabled={submitting} />
              <Input label="Code *" value={formType.code} onChange={(e) => setFormType((p) => ({ ...p, code: e.target.value }))} disabled={submitting} />
            </>
          )}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingId ? "Enregistrer" : "Créer"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
