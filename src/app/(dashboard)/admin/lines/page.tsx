"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { formatPercent } from "@/lib/trs-calculations";

interface LineData {
  id: string;
  code: string;
  name: string;
  workshopId: string;
  lineType: string | null;
  defaultSpeed: number | null;
  formatChangeTime: number | null;
  cleaningTime: number | null;
  targetOEE: number | null;
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

const EMPTY_FORM = {
  code: "",
  name: "",
  workshopId: "",
  lineType: "",
  defaultSpeed: "",
  formatChangeTime: "",
  cleaningTime: "",
  targetOEE: "",
  active: true,
};

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

  const loadLines = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/lines?all=true");
    setLines(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLines();
    fetch("/api/workshops")
      .then((r) => r.json())
      .then(setWorkshops);
  }, [loadLines]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(line: LineData) {
    setEditingId(line.id);
    setForm({
      code: line.code,
      name: line.name,
      workshopId: line.workshopId,
      lineType: line.lineType || "",
      defaultSpeed: line.defaultSpeed?.toString() || "",
      formatChangeTime: line.formatChangeTime?.toString() || "",
      cleaningTime: line.cleaningTime?.toString() || "",
      targetOEE: line.targetOEE ? (line.targetOEE * 100).toString() : "",
      active: line.active,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.code.trim() || !form.workshopId) {
      setError("Nom, code et atelier sont obligatoires");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      ...(editingId && { id: editingId }),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      workshopId: form.workshopId,
      lineType: form.lineType || null,
      defaultSpeed: form.defaultSpeed || null,
      formatChangeTime: form.formatChangeTime || null,
      cleaningTime: form.cleaningTime || null,
      targetOEE: form.targetOEE ? (parseFloat(form.targetOEE) / 100).toString() : null,
      active: form.active,
      userId: session?.user?.id,
    };

    const res = await fetch("/api/lines", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      loadLines();
    } else {
      const data = await res.json();
      setError(data.error || "Erreur lors de l'enregistrement");
    }

    setSubmitting(false);
  }

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const columns: Column<LineData>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      sortValue: (r) => r.code,
      accessor: (r) => <span className="font-mono font-semibold text-slate-900">{r.code}</span>,
    },
    {
      key: "name",
      header: "Nom",
      sortable: true,
      sortValue: (r) => r.name,
      accessor: (r) => r.name,
    },
    {
      key: "workshop",
      header: "Atelier",
      accessor: (r) => (
        <div>
          <p>{r.workshop?.name}</p>
          <p className="text-xs text-slate-500">{r.workshop?.site?.name}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      accessor: (r) => {
        if (!r.lineType) return <span className="text-slate-400">—</span>;
        const found = LINE_TYPES.find((t) => t.value === r.lineType);
        return <Badge variant="info">{found?.label || r.lineType}</Badge>;
      },
    },
    {
      key: "speed",
      header: "Cadence nom.",
      sortable: true,
      sortValue: (r) => r.defaultSpeed || 0,
      accessor: (r) =>
        r.defaultSpeed ? (
          <span>
            {r.defaultSpeed} <span className="text-xs text-slate-500">u/min</span>
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "formatChange",
      header: "Chgt format",
      accessor: (r) =>
        r.formatChangeTime ? (
          <span>
            {r.formatChangeTime} <span className="text-xs text-slate-500">min</span>
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "cleaning",
      header: "Nettoyage",
      accessor: (r) =>
        r.cleaningTime ? (
          <span>
            {r.cleaningTime} <span className="text-xs text-slate-500">min</span>
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "target",
      header: "TRS cible",
      sortable: true,
      sortValue: (r) => r.targetOEE || 0,
      accessor: (r) =>
        r.targetOEE ? (
          <Badge variant={r.targetOEE >= 0.85 ? "success" : "warning"}>
            {formatPercent(r.targetOEE)}
          </Badge>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "active",
      header: "Statut",
      accessor: (r) => (
        <Badge variant={r.active ? "success" : "default"}>
          {r.active ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      accessor: (r) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Modifier</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lignes de conditionnement</h1>
          <p className="text-sm text-slate-500">
            {lines.length} ligne{lines.length > 1 ? "s" : ""} configurée{lines.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Créer une ligne
        </Button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <DataTable
          data={lines}
          columns={columns}
          pageSize={15}
          searchable
          searchFn={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q) ||
            (r.workshop?.name || "").toLowerCase().includes(q)
          }
        />
      )}

      {/* Modal création / modification */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Modifier la ligne" : "Créer une ligne"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Code ligne *"
              placeholder="ex: BL01"
              value={form.code}
              onChange={(e) => updateField("code", e.target.value)}
            />
            <Input
              label="Nom ligne *"
              placeholder="ex: Ligne Blistéreuse 1"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Atelier *"
              options={workshops.map((w) => ({
                value: w.id,
                label: `${w.name} — ${w.site.name}`,
              }))}
              placeholder="Sélectionner un atelier"
              value={form.workshopId}
              onChange={(e) => updateField("workshopId", e.target.value)}
            />
            <Select
              label="Type de ligne"
              options={LINE_TYPES}
              placeholder="Sélectionner un type"
              value={form.lineType}
              onChange={(e) => updateField("lineType", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Cadence nominale (u/min)"
              type="number"
              step="0.1"
              min="0"
              placeholder="ex: 120"
              value={form.defaultSpeed}
              onChange={(e) => updateField("defaultSpeed", e.target.value)}
            />
            <Input
              label="Temps chgt format (min)"
              type="number"
              step="1"
              min="0"
              placeholder="ex: 30"
              value={form.formatChangeTime}
              onChange={(e) => updateField("formatChangeTime", e.target.value)}
            />
            <Input
              label="Temps nettoyage (min)"
              type="number"
              step="1"
              min="0"
              placeholder="ex: 20"
              value={form.cleaningTime}
              onChange={(e) => updateField("cleaningTime", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="TRS cible (%)"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="ex: 85"
              value={form.targetOEE}
              onChange={(e) => updateField("targetOEE", e.target.value)}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Statut</label>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => updateField("active", true)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    form.active
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Actif
                </button>
                <button
                  type="button"
                  onClick={() => updateField("active", false)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    !form.active
                      ? "bg-red-100 text-red-700 ring-2 ring-red-500"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Inactif
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editingId ? "Enregistrer" : "Créer la ligne"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
