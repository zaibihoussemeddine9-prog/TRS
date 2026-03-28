"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";

const ROLES = [
  { value: "ADMIN", label: "Administrateur" },
  { value: "RESPONSABLE", label: "Responsable" },
  { value: "OPERATEUR", label: "Opérateur" },
  { value: "LECTURE_SEULE", label: "Lecture seule" },
];

const DEPARTMENTS = [
  { value: "Production", label: "Production" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Qualité", label: "Qualité" },
  { value: "Logistique", label: "Logistique" },
  { value: "Direction", label: "Direction" },
  { value: "Autre", label: "Autre" },
];

const EMPTY = { firstName: "", lastName: "", email: "", password: "", role: "OPERATEUR", department: "", position: "", active: true };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/users"); if (r.ok) setUsers(await r.json()); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditingId(null); setForm(EMPTY); setError(""); setShowModal(true); }
  function openEdit(u: any) {
    setEditingId(u.id);
    setForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email, password: "", role: u.role, department: u.department || "", position: u.position || "", active: u.active });
    setError(""); setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.email.trim()) { setError("Email requis"); return; }
    if (!editingId && !form.password) { setError("Mot de passe requis pour un nouvel utilisateur"); return; }
    setSubmitting(true); setError("");
    try {
      const payload: Record<string, unknown> = { ...(editingId && { id: editingId }), firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role, department: form.department || null, position: form.position || null, active: form.active };
      if (form.password) payload.password = form.password;
      const res = await fetch("/api/users", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setSuccess(editingId ? "Utilisateur modifié" : "Utilisateur créé"); setShowModal(false); await load(); setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Erreur réseau"); } finally { setSubmitting(false); }
  }

  async function toggleActive(u: any) {
    await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id, active: !u.active }) });
    await load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    const res = await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (res.ok) { setSuccess("Utilisateur supprimé"); await load(); setTimeout(() => setSuccess(""), 4000); }
    else { setError(data.error || "Erreur"); setTimeout(() => setError(""), 6000); }
  }

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const roleLabel = (r: string) => ROLES.find(x => x.value === r)?.label || r;

  const columns: Column<any>[] = [
    { key: "avatar", header: "", accessor: (r) => <UserAvatar firstName={r.firstName} lastName={r.lastName} name={r.name} size="sm" /> },
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, accessor: (r) => (
      <div><p className="font-medium">{r.name}</p><p className="text-xs text-slate-500">{r.email}</p></div>
    )},
    { key: "dept", header: "Département", accessor: (r) => r.department || "—" },
    { key: "position", header: "Poste", accessor: (r) => r.position || "—" },
    { key: "role", header: "Rôle", accessor: (r) => <Badge variant="info">{roleLabel(r.role)}</Badge> },
    { key: "active", header: "Statut", accessor: (r) => (
      <button onClick={() => toggleActive(r)} className="cursor-pointer">
        <Badge variant={r.active ? "success" : "danger"}>{r.active ? "Actif" : "Inactif"}</Badge>
      </button>
    )},
    { key: "actions", header: "", accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Créer un utilisateur</Button>
      </div>
      {success && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4" />{success}</div>}
      {error && !showModal && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <DataTable data={users} columns={columns} pageSize={15} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.department || "").toLowerCase().includes(q)} />
      )}
      <Modal open={showModal} onClose={() => { if (!submitting) setShowModal(false); }} title={editingId ? "Modifier l'utilisateur" : "Créer un utilisateur"}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Prénom" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} disabled={submitting} />
            <Input label="Nom" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} disabled={submitting} />
          </div>
          <Input label="Email *" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={submitting} />
          <Input label={editingId ? "Nouveau mot de passe (laisser vide = inchangé)" : "Mot de passe *"} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} disabled={submitting} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Département" options={DEPARTMENTS} placeholder="Sélectionner" value={form.department} onChange={(e) => set("department", e.target.value)} disabled={submitting} />
            <Input label="Poste" placeholder="Ex: Chef d'équipe" value={form.position} onChange={(e) => set("position", e.target.value)} disabled={submitting} />
          </div>
          <Select label="Rôle" options={ROLES} value={form.role} onChange={(e) => set("role", e.target.value)} disabled={submitting} />
          <div className="flex gap-3">
            <button type="button" onClick={() => set("active", true)} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium ${form.active ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500" : "bg-slate-100 text-slate-500"}`}>Actif</button>
            <button type="button" onClick={() => set("active", false)} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium ${!form.active ? "bg-red-100 text-red-700 ring-2 ring-red-500" : "bg-slate-100 text-slate-500"}`}>Inactif</button>
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingId ? "Enregistrer" : "Créer"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
