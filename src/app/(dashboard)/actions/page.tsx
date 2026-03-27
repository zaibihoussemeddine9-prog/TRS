"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

interface ActionPlan {
  id: string;
  title: string;
  description: string | null;
  targetDate: string;
  priority: string;
  status: string;
  progress: number;
  assignedTo: { name: string };
  createdBy: { name: string };
  downtimeEntry: { cause: { name: string } } | null;
}

export default function ActionsPage() {
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/actions?${params}`);
      setActions(await res.json());
      setLoading(false);
    }
    load();
  }, [filterStatus]);

  const priorityBadge = (p: string) => {
    const map: Record<string, "default" | "info" | "warning" | "danger"> = {
      LOW: "default", MEDIUM: "info", HIGH: "warning", CRITICAL: "danger",
    };
    const labels: Record<string, string> = { LOW: "Faible", MEDIUM: "Moyen", HIGH: "Élevé", CRITICAL: "Critique" };
    return <Badge variant={map[p] || "default"}>{labels[p] || p}</Badge>;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
      TODO: "default", IN_PROGRESS: "info", DONE: "success", CANCELLED: "warning", OVERDUE: "danger",
    };
    const labels: Record<string, string> = { TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Terminé", CANCELLED: "Annulé", OVERDUE: "En retard" };
    return <Badge variant={map[s] || "default"}>{labels[s] || s}</Badge>;
  };

  const columns: Column<ActionPlan>[] = [
    { key: "title", header: "Action", accessor: (r) => (
      <div>
        <p className="font-medium text-slate-900">{r.title}</p>
        {r.downtimeEntry && <p className="text-xs text-slate-500">Cause : {r.downtimeEntry.cause.name}</p>}
      </div>
    )},
    { key: "assigned", header: "Responsable", accessor: (r) => r.assignedTo.name },
    { key: "target", header: "Échéance", sortable: true, sortValue: (r) => r.targetDate, accessor: (r) => formatDate(r.targetDate) },
    { key: "priority", header: "Priorité", accessor: (r) => priorityBadge(r.priority) },
    { key: "progress", header: "Avancement", accessor: (r) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${r.progress}%` }} />
        </div>
        <span className="text-xs text-slate-500">{r.progress}%</span>
      </div>
    )},
    { key: "status", header: "Statut", accessor: (r) => statusBadge(r.status) },
    { key: "actions", header: "", accessor: (r) => (
      <Link href={`/actions/${r.id}`} className="text-sm text-blue-600 hover:underline">Détails</Link>
    )},
  ];

  const statusOptions = [
    { value: "TODO", label: "À faire" },
    { value: "IN_PROGRESS", label: "En cours" },
    { value: "DONE", label: "Terminé" },
    { value: "OVERDUE", label: "En retard" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plans d'Actions</h1>
          <p className="text-sm text-slate-500">Suivi des actions correctives et préventives</p>
        </div>
        <Link href="/actions/new">
          <Button><Plus className="h-4 w-4" /> Nouvelle action</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="w-48">
          <Select options={statusOptions} placeholder="Tous les statuts" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <DataTable
          data={actions}
          columns={columns}
          pageSize={15}
          searchable
          searchFn={(row, q) => row.title.toLowerCase().includes(q) || row.assignedTo.name.toLowerCase().includes(q)}
        />
      )}
    </div>
  );
}
