"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
import { Plus, Pencil, Trash2, CheckCircle, Package, Clock, AlertTriangle, StopCircle, Play, Square } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

const DECL_EMPTY = { shiftId: "", date: "", quantityProduced: "", actualSpeed: "", microStopMinutes: "", comment: "" };
const DT_EMPTY = { categoryId: "", subCategoryId: "", startTime: "", endTime: "", description: "" };

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.id as string;
  const { data: session } = useSession();

  const [batch, setBatch] = useState<any>(null);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [downtimes, setDowntimes] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Declaration modal state
  const [showDeclModal, setShowDeclModal] = useState(false);
  const [editingDeclId, setEditingDeclId] = useState<string | null>(null);
  const [declForm, setDeclForm] = useState(DECL_EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Downtime state
  const [categories, setCategories] = useState<any[]>([]);
  const [showDtModal, setShowDtModal] = useState(false);
  const [editingDtId, setEditingDtId] = useState<string | null>(null);
  const [dtForm, setDtForm] = useState(DT_EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const batchRes = await fetch(`/api/production?id=${batchId}`);
      if (batchRes.ok) {
        setBatch(await batchRes.json());
      } else {
        setBatch(null);
        setLoading(false);
        return;
      }

      const [declRes, dtRes, shiftRes] = await Promise.all([
        fetch(`/api/production-declarations?batchId=${batchId}`).catch(() => null),
        fetch(`/api/downtimes?batchId=${batchId}`).catch(() => null),
        fetch("/api/shifts").catch(() => null),
      ]);
      setDeclarations(declRes?.ok ? await declRes.json() : []);
      setDowntimes(dtRes?.ok ? await dtRes.json() : []);
      setShifts(shiftRes?.ok ? await shiftRes.json() : []);
    } catch {
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  // Load categories on mount
  useEffect(() => {
    fetch("/api/causes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  // Cumuls
  const totalProduced = declarations.reduce((s: number, d: any) => s + (d.quantityProduced || 0), 0);
  const totalMicroStops = declarations.reduce((s: number, d: any) => s + (d.microStopMinutes || 0), 0);
  const totalDowntimeMin = downtimes.reduce((s: number, d: any) => s + (d.duration || 0), 0);
  const standardLotSize = batch?.product?.standardLotSize || 0;
  const progressPct = standardLotSize > 0 ? Math.min((totalProduced / standardLotSize) * 100, 100) : 0;

  // Weighted batch TRS
  const totalPlanned = declarations.reduce((s: number, d: any) => s + (d.plannedMinutes || 0), 0);
  const batchOEE = totalPlanned > 0 ? declarations.reduce((s: number, d: any) => s + (d.oee || 0) * (d.plannedMinutes || 0), 0) / totalPlanned : 0;
  const batchAvail = totalPlanned > 0 ? declarations.reduce((s: number, d: any) => s + (d.availability || 0) * (d.plannedMinutes || 0), 0) / totalPlanned : 0;
  const batchPerf = totalPlanned > 0 ? declarations.reduce((s: number, d: any) => s + (d.performance || 0) * (d.plannedMinutes || 0), 0) / totalPlanned : 0;

  // --- Declaration handlers ---

  function openCreateDecl() {
    setEditingDeclId(null);
    setDeclForm({
      ...DECL_EMPTY,
      date: batch ? new Date(batch.date).toISOString().split("T")[0] : "",
    });
    setError("");
    setShowDeclModal(true);
  }

  function openEditDecl(d: any) {
    setEditingDeclId(d.id);
    setDeclForm({
      shiftId: d.shiftId || "",
      date: d.date ? new Date(d.date).toISOString().split("T")[0] : "",
      quantityProduced: d.quantityProduced?.toString() || "",
      actualSpeed: d.actualSpeed?.toString() || "",
      microStopMinutes: d.microStopMinutes?.toString() || "",
      comment: d.comment || "",
    });
    setError("");
    setShowDeclModal(true);
  }

  async function handleDeclSubmit() {
    if (!declForm.shiftId || !declForm.date || !declForm.quantityProduced) {
      setError("Shift, date et quantité produite sont requis");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...(editingDeclId ? { id: editingDeclId } : { batchId }),
        shiftId: declForm.shiftId,
        date: declForm.date,
        quantityProduced: Number(declForm.quantityProduced),
        actualSpeed: Number(declForm.actualSpeed) || 0,
        microStopMinutes: Number(declForm.microStopMinutes) || 0,
        comment: declForm.comment || null,
        userId: session?.user?.id,
      };
      const res = await fetch("/api/production-declarations", {
        method: editingDeclId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        setError(`Erreur serveur (${res.status}): réponse non-JSON`);
        console.error("Non-JSON response:", text.substring(0, 300));
        return;
      }
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        setError(msg || `Erreur ${res.status}`);
        return;
      }
      setSuccess(editingDeclId ? "Déclaration modifiée" : "Déclaration ajoutée");
      setShowDeclModal(false);
      await load();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeclDelete(id: string) {
    if (!window.confirm("Supprimer cette déclaration ?")) return;
    try {
      await fetch("/api/production-declarations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setSuccess("Déclaration supprimée");
      await load();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      /* ignore */
    }
  }

  const setD = (k: string, v: string) => setDeclForm((p) => ({ ...p, [k]: v }));

  // --- Downtime handlers ---

  const setDt = (k: string, v: string) => setDtForm((p) => ({ ...p, [k]: v }));

  const filteredSubCategories = dtForm.categoryId
    ? categories.find((c: any) => c.id === dtForm.categoryId)?.subCategories || []
    : [];

  async function startDowntime() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/downtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, userId: session?.user?.id }),
      });
      if (res.ok) {
        setSuccess("Arrêt démarré");
        await load();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Erreur ${res.status}`);
        setTimeout(() => setError(""), 4000);
      }
    } catch {
      setError("Erreur réseau");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  async function closeDowntime(id: string) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/downtimes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, endTime: new Date().toISOString(), userId: session?.user?.id }),
      });
      if (res.ok) {
        setSuccess("Arrêt clôturé");
        await load();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Erreur ${res.status}`);
        setTimeout(() => setError(""), 4000);
      }
    } catch {
      setError("Erreur réseau");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  function openCreateDt() {
    setEditingDtId(null);
    setDtForm(DT_EMPTY);
    setError("");
    setShowDtModal(true);
  }

  function openEditDt(dt: any) {
    setEditingDtId(dt.id);
    const catId = dt.subCategory?.category?.id || dt.subCategory?.categoryId || "";
    setDtForm({
      categoryId: catId,
      subCategoryId: dt.subCategoryId || "",
      startTime: dt.startTime ? new Date(dt.startTime).toISOString().slice(0, 16) : "",
      endTime: dt.endTime ? new Date(dt.endTime).toISOString().slice(0, 16) : "",
      description: dt.description || "",
    });
    setError("");
    setShowDtModal(true);
  }

  async function deleteDt(id: string) {
    if (!window.confirm("Supprimer cet arrêt ?")) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/downtimes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSuccess("Arrêt supprimé");
        await load();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Erreur ${res.status}`);
        setTimeout(() => setError(""), 4000);
      }
    } catch {
      setError("Erreur réseau");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDt() {
    setSubmitting(true);
    setError("");
    try {
      const isEdit = !!editingDtId;
      const payload: any = isEdit
        ? { id: editingDtId, userId: session?.user?.id }
        : { batchId, userId: session?.user?.id };

      if (dtForm.subCategoryId) payload.subCategoryId = dtForm.subCategoryId;
      if (dtForm.startTime) payload.startTime = new Date(dtForm.startTime).toISOString();
      if (dtForm.endTime) payload.endTime = new Date(dtForm.endTime).toISOString();
      if (dtForm.description) payload.description = dtForm.description;

      const res = await fetch("/api/downtimes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        setError(`Erreur serveur (${res.status}): réponse non-JSON`);
        console.error("Non-JSON response:", text.substring(0, 300));
        return;
      }
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        setError(msg || `Erreur ${res.status}`);
        return;
      }
      setSuccess(isEdit ? "Arrêt modifié" : "Arrêt créé");
      setShowDtModal(false);
      await load();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Render ---

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  if (!batch)
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-slate-500">Lot introuvable</p>
        <p className="text-xs text-slate-400">ID: {batchId}</p>
        <a href="/production" className="text-sm text-blue-600 hover:underline">Retour à la liste</a>
      </div>
    );

  const declColumns: Column<any>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (r) => r.date,
      accessor: (r) => formatDate(r.date),
    },
    { key: "shift", header: "Shift", accessor: (r) => r.shift?.name || "—" },
    {
      key: "qty",
      header: "Qté produite",
      sortable: true,
      sortValue: (r) => r.quantityProduced,
      accessor: (r) => r.quantityProduced?.toLocaleString("fr-FR") || "0",
    },
    { key: "speed", header: "Cadence", accessor: (r) => r.actualSpeed ? `${r.actualSpeed} u/min` : "—" },
    { key: "micro", header: "µ-arrêts", accessor: (r) => r.microStopMinutes ? `${r.microStopMinutes} min` : "0" },
    { key: "oee", header: "TRS", sortable: true, sortValue: (r) => r.oee || 0, accessor: (r) => {
      const v = r.oee || 0;
      const color = v >= 0.85 ? "text-emerald-600" : v >= 0.65 ? "text-amber-600" : "text-red-600";
      return <span className={`font-semibold ${color}`}>{(v * 100).toFixed(1)}%</span>;
    }},
    {
      key: "comment",
      header: "Commentaire",
      accessor: (r) =>
        r.comment ? (
          <span className="text-xs text-slate-600 max-w-[120px] truncate block">{r.comment}</span>
        ) : (
          "—"
        ),
    },
    { key: "by", header: "Par", accessor: (r) => r.createdBy?.name || "—" },
    {
      key: "actions",
      header: "",
      accessor: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditDecl(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeclDelete(r.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const dtColumns: Column<any>[] = [
    {
      key: "start",
      header: "Début",
      sortable: true,
      sortValue: (r) => r.startTime,
      accessor: (r) => formatDateTime(r.startTime),
    },
    { key: "cat", header: "Catégorie", accessor: (r) => r.subCategory?.category?.name || "—" },
    { key: "sub", header: "Sous-catégorie", accessor: (r) => r.subCategory?.name || "—" },
    {
      key: "dur",
      header: "Durée (min)",
      accessor: (r) => {
        if (r.endTime == null) {
          const elapsed = Math.round((Date.now() - new Date(r.startTime).getTime()) / 60000);
          return (
            <span className="flex items-center gap-1.5">
              <Badge variant="warning">En cours</Badge>
              <span className="text-sm font-medium text-amber-700">{elapsed} min</span>
            </span>
          );
        }
        return r.duration != null ? Math.round(r.duration) : "—";
      },
    },
    { key: "desc", header: "Description", accessor: (r) => r.description || "—" },
    {
      key: "actions",
      header: "",
      accessor: (r) => (
        <div className="flex gap-1">
          {r.endTime == null && (
            <Button variant="ghost" size="sm" onClick={() => closeDowntime(r.id)} title="Clôturer">
              <Square className="h-4 w-4 text-amber-600" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => openEditDt(r)} title="Modifier">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteDt(r.id)} title="Supprimer">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Informations du lot */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Lot {batch.lot}</h1>
              <p className="text-sm text-slate-500">
                Créé par {batch.createdBy?.name} le {formatDate(batch.createdAt)}
              </p>
            </div>
            <Badge
              variant={batch.status === "OPEN" ? "success" : "default"}
              className="text-sm"
            >
              {batch.status === "OPEN" ? "Ouvert" : "Clôturé"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-slate-500">Ligne</p>
              <p className="font-medium">{batch.line?.name}</p>
            </div>
            <div>
              <p className="text-slate-500">Produit</p>
              <p className="font-medium">{batch.product?.name}</p>
            </div>
            <div>
              <p className="text-slate-500">Shift</p>
              <p className="font-medium">{batch.shift?.name}</p>
            </div>
            <div>
              <p className="text-slate-500">Date</p>
              <p className="font-medium">{formatDate(batch.date)}</p>
            </div>
            {batch.orderNumber && (
              <div>
                <p className="text-slate-500">N° OF / OC</p>
                <p className="font-medium">{batch.orderNumber}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TRS + Cumuls */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className={`p-4 text-center border-l-4 ${batchOEE >= 0.85 ? "border-l-emerald-500" : batchOEE >= 0.65 ? "border-l-amber-500" : "border-l-red-500"}`}>
          <p className={`text-2xl font-bold ${batchOEE >= 0.85 ? "text-emerald-600" : batchOEE >= 0.65 ? "text-amber-600" : "text-red-600"}`}>
            {(batchOEE * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500">TRS Lot</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{(batchAvail * 100).toFixed(1)}%</p>
          <p className="text-xs text-slate-500">Disponibilité</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{(batchPerf * 100).toFixed(1)}%</p>
          <p className="text-xs text-slate-500">Performance</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{declarations.length}</p>
          <p className="text-xs text-slate-500">Shifts déclarés</p>
        </Card>
      </div>

      {/* Avancement + Production */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Avancement du lot</p>
            <p className="text-sm font-bold text-blue-600">{progressPct.toFixed(0)}%</p>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-blue-600 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {totalProduced.toLocaleString("fr-FR")} / {standardLotSize > 0 ? standardLotSize.toLocaleString("fr-FR") : "—"} unités
          </p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-slate-900">{totalMicroStops} min</p>
          <p className="text-xs text-slate-500">Micro-arrêts</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold text-slate-900">{Math.round(totalDowntimeMin)} min</p>
          <p className="text-xs text-slate-500">Arrêts déclarés</p>
        </Card>
      </div>

      {/* Déclarations shift */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Déclarations shift</h2>
            <Button size="sm" onClick={openCreateDecl}>
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {declarations.length === 0 ? (
            <p className="py-6 text-center text-slate-500">Aucune déclaration shift</p>
          ) : (
            <DataTable data={declarations} columns={declColumns} pageSize={10} />
          )}
        </CardContent>
      </Card>

      {/* Arrêts enregistrés */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Arrêts enregistrés</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={openCreateDt}>
                <Plus className="h-4 w-4" /> Nouveau
              </Button>
              <Button size="sm" onClick={startDowntime} loading={submitting}>
                <Play className="h-4 w-4" /> Démarrer un arrêt
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {downtimes.length === 0 ? (
            <p className="py-6 text-center text-slate-500">Aucun arrêt enregistré</p>
          ) : (
            <DataTable data={downtimes} columns={dtColumns} pageSize={10} />
          )}
        </CardContent>
      </Card>

      {/* Modal déclaration */}
      <Modal
        open={showDeclModal}
        onClose={() => {
          if (!submitting) setShowDeclModal(false);
        }}
        title={editingDeclId ? "Modifier la déclaration" : "Nouvelle déclaration shift"}
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Select
            label="Shift *"
            options={shifts.map((s: any) => ({
              value: s.id,
              label: `${s.name} (${s.startTime}–${s.endTime})`,
            }))}
            placeholder="Sélectionner"
            value={declForm.shiftId}
            onChange={(e) => setD("shiftId", e.target.value)}
            disabled={submitting}
          />
          <Input
            label="Date *"
            type="date"
            value={declForm.date}
            onChange={(e) => setD("date", e.target.value)}
            disabled={submitting}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Quantité produite *"
              type="number"
              min="0"
              value={declForm.quantityProduced}
              onChange={(e) => setD("quantityProduced", e.target.value)}
              disabled={submitting}
            />
            <Input
              label="Cadence réelle (u/min)"
              type="number"
              min="0"
              step="0.1"
              placeholder={batch?.product?.nominalSpeed ? `Nominale: ${batch.product.nominalSpeed}` : ""}
              value={declForm.actualSpeed}
              onChange={(e) => setD("actualSpeed", e.target.value)}
              disabled={submitting}
            />
          </div>
          <Input
            label="Durée totale micro-arrêts (min)"
            type="number"
            min="0"
            value={declForm.microStopMinutes}
            onChange={(e) => setD("microStopMinutes", e.target.value)}
            disabled={submitting}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Commentaire</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
              value={declForm.comment}
              onChange={(e) => setD("comment", e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDeclModal(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={handleDeclSubmit} loading={submitting}>
              {editingDeclId ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal arrêt (création / modification) */}
      <Modal
        open={showDtModal}
        onClose={() => {
          if (!submitting) setShowDtModal(false);
        }}
        title={editingDtId ? "Modifier l'arrêt" : "Nouvel arrêt"}
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Select
            label="Catégorie"
            options={categories.map((c: any) => ({
              value: c.id,
              label: c.name,
            }))}
            placeholder="— Aucune —"
            value={dtForm.categoryId}
            onChange={(e) => {
              setDt("categoryId", e.target.value);
              setDt("subCategoryId", "");
            }}
            disabled={submitting}
          />
          <Select
            label="Sous-catégorie"
            options={filteredSubCategories.map((sc: any) => ({
              value: sc.id,
              label: sc.name,
            }))}
            placeholder={dtForm.categoryId ? "— Aucune —" : "Choisir une catégorie d'abord"}
            value={dtForm.subCategoryId}
            onChange={(e) => setDt("subCategoryId", e.target.value)}
            disabled={submitting || !dtForm.categoryId}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Début"
              type="datetime-local"
              value={dtForm.startTime}
              onChange={(e) => setDt("startTime", e.target.value)}
              disabled={submitting}
            />
            <Input
              label="Fin"
              type="datetime-local"
              value={dtForm.endTime}
              onChange={(e) => setDt("endTime", e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
              value={dtForm.description}
              onChange={(e) => setDt("description", e.target.value)}
              disabled={submitting}
              placeholder="Description de l'arrêt (optionnel)"
            />
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDtModal(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={submitDt} loading={submitting}>
              {editingDtId ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
