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
import { Plus, Pencil, Trash2, CheckCircle, Package, Clock, AlertTriangle } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

const DECL_EMPTY = { shiftId: "", date: "", quantityProduced: "", microStopMinutes: "", comment: "" };

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.id as string;
  const { data: session } = useSession();

  const [batch, setBatch] = useState<any>(null);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [downtimes, setDowntimes] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDeclModal, setShowDeclModal] = useState(false);
  const [editingDeclId, setEditingDeclId] = useState<string | null>(null);
  const [declForm, setDeclForm] = useState(DECL_EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, declRes, dtRes, shiftRes] = await Promise.all([
        fetch("/api/production").then((r) => r.json()),
        fetch(`/api/production-declarations?batchId=${batchId}`).then((r) => r.json()),
        fetch(`/api/downtimes?batchId=${batchId}`).then((r) => r.json()),
        fetch("/api/shifts").then((r) => r.json()),
      ]);
      const found = Array.isArray(batchRes) ? batchRes.find((b: any) => b.id === batchId) : null;
      setBatch(found);
      setDeclarations(Array.isArray(declRes) ? declRes : []);
      setDowntimes(Array.isArray(dtRes) ? dtRes : []);
      setShifts(Array.isArray(shiftRes) ? shiftRes : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  // Cumuls
  const totalProduced = declarations.reduce((s: number, d: any) => s + (d.quantityProduced || 0), 0);
  const totalMicroStops = declarations.reduce((s: number, d: any) => s + (d.microStopMinutes || 0), 0);
  const totalDowntimeMin = downtimes.reduce((s: number, d: any) => s + (d.duration || 0), 0);

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
        microStopMinutes: Number(declForm.microStopMinutes) || 0,
        comment: declForm.comment || null,
        userId: session?.user?.id,
      };
      const res = await fetch("/api/production-declarations", {
        method: editingDeclId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
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

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  if (!batch)
    return <div className="py-12 text-center text-slate-500">Lot introuvable</div>;

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
    { key: "micro", header: "Micro-arrêts (min)", accessor: (r) => r.microStopMinutes || 0 },
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
      accessor: (r) => (r.duration != null ? Math.round(r.duration) : "En cours"),
    },
    { key: "desc", header: "Description", accessor: (r) => r.description || "—" },
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

      {/* Cumuls */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <Package className="h-5 w-5 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-slate-900">
            {totalProduced.toLocaleString("fr-FR")}
          </p>
          <p className="text-xs text-slate-500">Total produit</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-slate-900">{totalMicroStops}</p>
          <p className="text-xs text-slate-500">Micro-arrêts (min)</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold text-slate-900">{Math.round(totalDowntimeMin)}</p>
          <p className="text-xs text-slate-500">Arrêts (min)</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{declarations.length}</p>
          <p className="text-xs text-slate-500">Shifts déclarés</p>
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
          <h2 className="text-lg font-semibold">Arrêts enregistrés</h2>
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
          <Input
            label="Quantité produite *"
            type="number"
            min="0"
            value={declForm.quantityProduced}
            onChange={(e) => setD("quantityProduced", e.target.value)}
            disabled={submitting}
          />
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
    </div>
  );
}
