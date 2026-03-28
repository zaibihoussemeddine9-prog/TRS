"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Upload, Download, CheckCircle, AlertTriangle, X, Package } from "lucide-react";
import { formatPercent } from "@/lib/trs-calculations";

interface FormatData {
  id?: string;
  name: string;
  code: string;
  unitsPerBlister: string;
  blistersPerBox: string;
  boxesPerCarton: string;
  cartonsPerPallet: string;
  unitsPerPack: string;
}

interface LineConfigData {
  lineId: string;
  lineName?: string;
  nominalSpeed: string;
  standardSpeed: string;
  startupTime: string;
  lineEmptyingTime: string;
  formatChangeTime: string;
  lotChangeTime: string;
  cleaningTime: string;
  adjustmentTime: string;
  targetOEE: string;
  comments: string;
}

interface ProductData {
  id: string;
  code: string;
  name: string;
  family: string | null;
  form: string | null;
  dosage: string | null;
  primaryPackaging: string | null;
  secondaryPackaging: string | null;
  standardLotSize: number | null;
  targetYield: number | null;
  targetRejectRate: number | null;
  targetOEE: number | null;
  qualityConstraints: string | null;
  processConstraints: string | null;
  planningNotes: string | null;
  comments: string | null;
  active: boolean;
  formats: any[];
  productLineConfigs: any[];
}

interface LineOption {
  id: string;
  name: string;
  code: string;
}

interface ImportResult {
  row: number;
  code: string;
  status: "created" | "updated" | "error";
  message: string;
}

const EMPTY_FORMAT: FormatData = { name: "", code: "", unitsPerBlister: "", blistersPerBox: "", boxesPerCarton: "", cartonsPerPallet: "", unitsPerPack: "" };

const EMPTY_LINE_CONFIG: LineConfigData = {
  lineId: "", nominalSpeed: "", standardSpeed: "", startupTime: "", lineEmptyingTime: "",
  formatChangeTime: "", lotChangeTime: "", cleaningTime: "", adjustmentTime: "", targetOEE: "", comments: "",
};

const EMPTY_FORM = {
  code: "", name: "", family: "", form: "", dosage: "",
  primaryPackaging: "", secondaryPackaging: "",
  standardLotSize: "", targetYield: "", targetRejectRate: "", targetOEE: "",
  qualityConstraints: "", processConstraints: "", planningNotes: "", comments: "",
  active: true,
};

const FAMILIES = [
  { value: "Antibiotiques", label: "Antibiotiques" },
  { value: "Antalgiques", label: "Antalgiques" },
  { value: "Anti-inflammatoires", label: "Anti-inflammatoires" },
  { value: "Gastro", label: "Gastro-entérologie" },
  { value: "Sirops", label: "Sirops" },
  { value: "Dermatologie", label: "Dermatologie" },
  { value: "Cardiovasculaire", label: "Cardiovasculaire" },
  { value: "Autre", label: "Autre" },
];

const FORMS = [
  { value: "Comprimé", label: "Comprimé" },
  { value: "Gélule", label: "Gélule" },
  { value: "Sirop", label: "Sirop" },
  { value: "Pommade", label: "Pommade" },
  { value: "Crème", label: "Crème" },
  { value: "Solution", label: "Solution" },
  { value: "Suppositoire", label: "Suppositoire" },
  { value: "Injectable", label: "Injectable" },
  { value: "Autre", label: "Autre" },
];

export default function AdminProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [lines, setLines] = useState<LineOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formats, setFormats] = useState<FormatData[]>([]);
  const [lineConfigs, setLineConfigs] = useState<LineConfigData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "formats" | "lines" | "quality">("general");

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ summary: any; results: ImportResult[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?all=true");
      if (res.ok) setProducts(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadProducts();
    fetch("/api/lines?all=true").then((r) => r.json()).then((data) =>
      setLines(data.map((l: any) => ({ id: l.id, name: l.name, code: l.code })))
    ).catch(() => setLines([]));
  }, [loadProducts]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormats([{ ...EMPTY_FORMAT }]);
    setLineConfigs([]);
    setError("");
    setSuccess("");
    setActiveTab("general");
    setShowModal(true);
  }

  function openEdit(p: ProductData) {
    setEditingId(p.id);
    setForm({
      code: p.code, name: p.name,
      family: p.family || "", form: p.form || "", dosage: p.dosage || "",
      primaryPackaging: p.primaryPackaging || "", secondaryPackaging: p.secondaryPackaging || "",
      standardLotSize: p.standardLotSize?.toString() || "",
      targetYield: p.targetYield ? (p.targetYield * 100).toFixed(0) : "",
      targetRejectRate: p.targetRejectRate ? (p.targetRejectRate * 100).toFixed(1) : "",
      targetOEE: p.targetOEE ? (p.targetOEE * 100).toFixed(0) : "",
      qualityConstraints: p.qualityConstraints || "",
      processConstraints: p.processConstraints || "",
      planningNotes: p.planningNotes || "",
      comments: p.comments || "",
      active: p.active,
    });
    setFormats(p.formats.length > 0 ? p.formats.map((f: any) => ({
      id: f.id, name: f.name, code: f.code,
      unitsPerBlister: f.unitsPerBlister?.toString() || "",
      blistersPerBox: f.blistersPerBox?.toString() || "",
      boxesPerCarton: f.boxesPerCarton?.toString() || "",
      cartonsPerPallet: f.cartonsPerPallet?.toString() || "",
      unitsPerPack: f.unitsPerPack?.toString() || "",
    })) : [{ ...EMPTY_FORMAT }]);
    setLineConfigs(p.productLineConfigs.map((lc: any) => ({
      lineId: lc.lineId,
      lineName: lc.line?.name || "",
      nominalSpeed: lc.nominalSpeed?.toString() || "",
      standardSpeed: lc.standardSpeed?.toString() || "",
      startupTime: lc.startupTime?.toString() || "",
      lineEmptyingTime: lc.lineEmptyingTime?.toString() || "",
      formatChangeTime: lc.formatChangeTime?.toString() || "",
      lotChangeTime: lc.lotChangeTime?.toString() || "",
      cleaningTime: lc.cleaningTime?.toString() || "",
      adjustmentTime: lc.adjustmentTime?.toString() || "",
      targetOEE: lc.targetOEE ? (lc.targetOEE * 100).toFixed(0) : "",
      comments: lc.comments || "",
    })));
    setError("");
    setSuccess("");
    setActiveTab("general");
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.code.trim()) {
      setError("Nom et code produit sont obligatoires");
      return;
    }

    const validFormats = formats.filter((f) => f.name.trim() && f.code.trim());
    const validLineConfigs = lineConfigs.filter((lc) => lc.lineId);

    setSubmitting(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const payload = {
        ...(editingId && { id: editingId }),
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        family: form.family || null,
        form: form.form || null,
        dosage: form.dosage || null,
        primaryPackaging: form.primaryPackaging || null,
        secondaryPackaging: form.secondaryPackaging || null,
        standardLotSize: form.standardLotSize || null,
        targetYield: form.targetYield ? Number(form.targetYield) / 100 : null,
        targetRejectRate: form.targetRejectRate ? Number(form.targetRejectRate) / 100 : null,
        targetOEE: form.targetOEE ? Number(form.targetOEE) / 100 : null,
        qualityConstraints: form.qualityConstraints || null,
        processConstraints: form.processConstraints || null,
        planningNotes: form.planningNotes || null,
        comments: form.comments || null,
        active: form.active,
        formats: validFormats.map((f) => ({
          name: f.name.trim(), code: f.code.trim().toUpperCase(),
          unitsPerBlister: f.unitsPerBlister || null,
          blistersPerBox: f.blistersPerBox || null,
          boxesPerCarton: f.boxesPerCarton || null,
          cartonsPerPallet: f.cartonsPerPallet || null,
          unitsPerPack: f.unitsPerPack || null,
        })),
        lineConfigs: validLineConfigs.map((lc) => ({
          lineId: lc.lineId,
          nominalSpeed: lc.nominalSpeed || null,
          standardSpeed: lc.standardSpeed || null,
          startupTime: lc.startupTime || null,
          lineEmptyingTime: lc.lineEmptyingTime || null,
          formatChangeTime: lc.formatChangeTime || null,
          lotChangeTime: lc.lotChangeTime || null,
          cleaningTime: lc.cleaningTime || null,
          adjustmentTime: lc.adjustmentTime || null,
          targetOEE: lc.targetOEE ? Number(lc.targetOEE) / 100 : null,
          comments: lc.comments || null,
        })),
        userId: session?.user?.id || null,
      };

      const res = await fetch("/api/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : { error: "Réponse serveur invalide" };

      if (!res.ok) {
        setError(data.error || `Erreur ${res.status}`);
        return;
      }

      setSuccess(editingId ? `Produit "${form.name}" modifié` : `Produit "${form.name}" créé`);
      setShowModal(false);
      await loadProducts();
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

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Sélectionnez un fichier Excel"); return; }

    setImporting(true);
    setImportResults(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/products/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'import");
      } else {
        setImportResults(data);
        await loadProducts();
      }
    } catch {
      setError("Erreur réseau lors de l'import");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const headers = ["code", "name", "family", "form", "dosage", "primaryPackaging", "secondaryPackaging", "standardLotSize", "targetYield", "targetRejectRate", "targetOEE", "formatCode", "formatName", "unitsPerBlister", "blistersPerBox", "boxesPerCarton", "cartonsPerPallet", "unitsPerPack"];
    const example = ["AMX500", "Amoxicilline 500mg", "Antibiotiques", "Gélule", "500mg", "Blister ALU/PVC", "Étui carton", "100000", "98", "1.5", "85", "BL10-AMX", "Blister 10 gélules", "10", "3", "12", "48", "30"];
    const csv = [headers.join(";"), example.join(";")].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele_import_produits.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateFormat(idx: number, field: string, value: string) {
    setFormats((prev) => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  }

  function addFormat() { setFormats((prev) => [...prev, { ...EMPTY_FORMAT }]); }
  function removeFormat(idx: number) { setFormats((prev) => prev.filter((_, i) => i !== idx)); }

  function updateLineConfig(idx: number, field: string, value: string) {
    setLineConfigs((prev) => prev.map((lc, i) => i === idx ? { ...lc, [field]: value } : lc));
  }

  function addLineConfig() { setLineConfigs((prev) => [...prev, { ...EMPTY_LINE_CONFIG }]); }
  function removeLineConfig(idx: number) { setLineConfigs((prev) => prev.filter((_, i) => i !== idx)); }

  const columns: Column<ProductData>[] = [
    { key: "code", header: "Code", sortable: true, sortValue: (r) => r.code, accessor: (r) => <span className="font-mono font-semibold">{r.code}</span> },
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, accessor: (r) => r.name },
    { key: "family", header: "Famille", accessor: (r) => r.family ? <Badge variant="info">{r.family}</Badge> : <span className="text-slate-400">—</span> },
    { key: "form", header: "Forme", accessor: (r) => r.form ? `${r.form}${r.dosage ? ` ${r.dosage}` : ""}` : "—" },
    { key: "formats", header: "Formats", accessor: (r) => <Badge variant="default">{r.formats?.length || 0}</Badge> },
    { key: "lines", header: "Lignes", accessor: (r) => <Badge variant="default">{r.productLineConfigs?.length || 0}</Badge> },
    { key: "oee", header: "TRS cible", sortable: true, sortValue: (r) => r.targetOEE || 0, accessor: (r) => r.targetOEE ? <Badge variant={r.targetOEE >= 0.85 ? "success" : "warning"}>{formatPercent(r.targetOEE)}</Badge> : <span className="text-slate-400">—</span> },
    { key: "active", header: "Statut", accessor: (r) => <Badge variant={r.active ? "success" : "default"}>{r.active ? "Actif" : "Inactif"}</Badge> },
    { key: "actions", header: "", accessor: (r) => <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /><span className="hidden sm:inline">Modifier</span></Button> },
  ];

  const tabs = [
    { key: "general" as const, label: "Général" },
    { key: "formats" as const, label: `Formats (${formats.filter(f => f.name).length})` },
    { key: "lines" as const, label: `Lignes (${lineConfigs.filter(lc => lc.lineId).length})` },
    { key: "quality" as const, label: "Qualité & Process" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produits & Formats</h1>
          <p className="text-sm text-slate-500">{products.length} produit{products.length > 1 ? "s" : ""} — Base TRS</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowImport(!showImport); setImportResults(null); }}>
            <Upload className="h-4 w-4" /> Import Excel
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Créer un produit
          </Button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />{success}
        </div>
      )}

      {/* Import panel */}
      {showImport && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">Import Excel / CSV</h3>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}><Download className="h-4 w-4" /> Télécharger le modèle</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fichier Excel (.xlsx, .csv)</label>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <Button onClick={handleImport} loading={importing} disabled={importing}>Importer</Button>
            </div>

            {importResults && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-lg bg-slate-100 px-3 py-1 font-medium">{importResults.summary.total} lignes</span>
                  <span className="rounded-lg bg-emerald-100 px-3 py-1 text-emerald-700">{importResults.summary.created} créés</span>
                  <span className="rounded-lg bg-blue-100 px-3 py-1 text-blue-700">{importResults.summary.updated} mis à jour</span>
                  {importResults.summary.errors > 0 && <span className="rounded-lg bg-red-100 px-3 py-1 text-red-700">{importResults.summary.errors} erreurs</span>}
                </div>
                {importResults.results.some((r) => r.status === "error") && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
                    {importResults.results.filter((r) => r.status === "error").map((r, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Ligne {r.row} ({r.code}) : {r.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : (
        <DataTable data={products} columns={columns} pageSize={15} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || (r.family || "").toLowerCase().includes(q)} />
      )}

      {/* Product form modal */}
      <Modal open={showModal} onClose={() => { if (!submitting) setShowModal(false); }} title={editingId ? "Modifier le produit" : "Créer un produit"} className="max-w-4xl">
        <div className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === t.key ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}
              >{t.label}</button>
            ))}
          </div>

          {/* General tab */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input label="Code produit *" placeholder="ex: AMX500" value={form.code} onChange={(e) => updateField("code", e.target.value)} disabled={submitting} />
                <Input label="Nom produit *" placeholder="ex: Amoxicilline 500mg" value={form.name} onChange={(e) => updateField("name", e.target.value)} disabled={submitting} className="sm:col-span-2" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Select label="Famille" options={FAMILIES} placeholder="Sélectionner" value={form.family} onChange={(e) => updateField("family", e.target.value)} disabled={submitting} />
                <Select label="Forme galénique" options={FORMS} placeholder="Sélectionner" value={form.form} onChange={(e) => updateField("form", e.target.value)} disabled={submitting} />
                <Input label="Dosage" placeholder="ex: 500mg" value={form.dosage} onChange={(e) => updateField("dosage", e.target.value)} disabled={submitting} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Conditionnement primaire" placeholder="ex: Blister ALU/PVC" value={form.primaryPackaging} onChange={(e) => updateField("primaryPackaging", e.target.value)} disabled={submitting} />
                <Input label="Conditionnement secondaire" placeholder="ex: Étui carton" value={form.secondaryPackaging} onChange={(e) => updateField("secondaryPackaging", e.target.value)} disabled={submitting} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Input label="Taille lot standard" type="number" min="0" placeholder="ex: 100000" value={form.standardLotSize} onChange={(e) => updateField("standardLotSize", e.target.value)} disabled={submitting} />
                <Input label="Rendement cible (%)" type="number" step="0.1" min="0" max="100" placeholder="ex: 98" value={form.targetYield} onChange={(e) => updateField("targetYield", e.target.value)} disabled={submitting} />
                <Input label="Rebut cible (%)" type="number" step="0.1" min="0" max="100" placeholder="ex: 1.5" value={form.targetRejectRate} onChange={(e) => updateField("targetRejectRate", e.target.value)} disabled={submitting} />
                <Input label="TRS cible (%)" type="number" step="1" min="0" max="100" placeholder="ex: 85" value={form.targetOEE} onChange={(e) => updateField("targetOEE", e.target.value)} disabled={submitting} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Statut</label>
                  <div className="flex items-center gap-3 pt-1">
                    <button type="button" onClick={() => updateField("active", true)} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${form.active ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500" : "bg-slate-100 text-slate-500"}`}>Actif</button>
                    <button type="button" onClick={() => updateField("active", false)} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${!form.active ? "bg-red-100 text-red-700 ring-2 ring-red-500" : "bg-slate-100 text-slate-500"}`}>Inactif</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formats tab */}
          {activeTab === "formats" && (
            <div className="space-y-3">
              {formats.map((fmt, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Format {idx + 1}</span>
                    {formats.length > 1 && <button onClick={() => removeFormat(idx)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="Code format" placeholder="ex: BL10" value={fmt.code} onChange={(e) => updateFormat(idx, "code", e.target.value)} disabled={submitting} />
                    <Input label="Nom format" placeholder="ex: Blister 10 cp" value={fmt.name} onChange={(e) => updateFormat(idx, "name", e.target.value)} disabled={submitting} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <Input label="U/blister" type="number" min="0" value={fmt.unitsPerBlister} onChange={(e) => updateFormat(idx, "unitsPerBlister", e.target.value)} disabled={submitting} />
                    <Input label="Blisters/boîte" type="number" min="0" value={fmt.blistersPerBox} onChange={(e) => updateFormat(idx, "blistersPerBox", e.target.value)} disabled={submitting} />
                    <Input label="Boîtes/carton" type="number" min="0" value={fmt.boxesPerCarton} onChange={(e) => updateFormat(idx, "boxesPerCarton", e.target.value)} disabled={submitting} />
                    <Input label="Cartons/palette" type="number" min="0" value={fmt.cartonsPerPallet} onChange={(e) => updateFormat(idx, "cartonsPerPallet", e.target.value)} disabled={submitting} />
                    <Input label="U/conditionnement" type="number" min="0" value={fmt.unitsPerPack} onChange={(e) => updateFormat(idx, "unitsPerPack", e.target.value)} disabled={submitting} />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFormat}><Plus className="h-4 w-4" /> Ajouter un format</Button>
            </div>
          )}

          {/* Lines compatibility tab */}
          {activeTab === "lines" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Cadences et temps standards par ligne compatible</p>
              {lineConfigs.map((lc, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Select label="Ligne" options={lines.map((l) => ({ value: l.id, label: `${l.code} — ${l.name}` }))} placeholder="Sélectionner une ligne" value={lc.lineId} onChange={(e) => updateLineConfig(idx, "lineId", e.target.value)} disabled={submitting} />
                    </div>
                    <button onClick={() => removeLineConfig(idx)} className="ml-2 mt-6 text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Input label="Cadence nom. (u/min)" type="number" step="0.1" min="0" value={lc.nominalSpeed} onChange={(e) => updateLineConfig(idx, "nominalSpeed", e.target.value)} disabled={submitting} />
                    <Input label="Cadence std (u/min)" type="number" step="0.1" min="0" value={lc.standardSpeed} onChange={(e) => updateLineConfig(idx, "standardSpeed", e.target.value)} disabled={submitting} />
                    <Input label="TRS cible (%)" type="number" step="1" min="0" max="100" value={lc.targetOEE} onChange={(e) => updateLineConfig(idx, "targetOEE", e.target.value)} disabled={submitting} />
                    <Input label="Démarrage (min)" type="number" step="1" min="0" value={lc.startupTime} onChange={(e) => updateLineConfig(idx, "startupTime", e.target.value)} disabled={submitting} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Input label="Vide de ligne (min)" type="number" step="1" min="0" value={lc.lineEmptyingTime} onChange={(e) => updateLineConfig(idx, "lineEmptyingTime", e.target.value)} disabled={submitting} />
                    <Input label="Chgt format (min)" type="number" step="1" min="0" value={lc.formatChangeTime} onChange={(e) => updateLineConfig(idx, "formatChangeTime", e.target.value)} disabled={submitting} />
                    <Input label="Chgt lot (min)" type="number" step="1" min="0" value={lc.lotChangeTime} onChange={(e) => updateLineConfig(idx, "lotChangeTime", e.target.value)} disabled={submitting} />
                    <Input label="Nettoyage (min)" type="number" step="1" min="0" value={lc.cleaningTime} onChange={(e) => updateLineConfig(idx, "cleaningTime", e.target.value)} disabled={submitting} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                    <Input label="Réglage (min)" type="number" step="1" min="0" value={lc.adjustmentTime} onChange={(e) => updateLineConfig(idx, "adjustmentTime", e.target.value)} disabled={submitting} />
                    <Input label="Commentaires" value={lc.comments} onChange={(e) => updateLineConfig(idx, "comments", e.target.value)} disabled={submitting} />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLineConfig}><Plus className="h-4 w-4" /> Ajouter une ligne compatible</Button>
            </div>
          )}

          {/* Quality tab */}
          {activeTab === "quality" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraintes qualité</label>
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} placeholder="Conditions de stockage, sensibilité lumière, humidité..." value={form.qualityConstraints} onChange={(e) => updateField("qualityConstraints", e.target.value)} disabled={submitting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraintes process</label>
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} placeholder="Température, pression, vitesse max..." value={form.processConstraints} onChange={(e) => updateField("processConstraints", e.target.value)} disabled={submitting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes de planification</label>
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={2} placeholder="Séquences de production recommandées, compatibilités..." value={form.planningNotes} onChange={(e) => updateField("planningNotes", e.target.value)} disabled={submitting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commentaires généraux</label>
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={2} value={form.comments} onChange={(e) => updateField("comments", e.target.value)} disabled={submitting} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingId ? "Enregistrer" : "Créer le produit"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
