"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  RESPONSABLE: "Responsable",
  OPERATEUR: "Opérateur",
  LECTURE_SEULE: "Lecture seule",
};

const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({ value, label }));

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "LECTURE_SEULE" });

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate() {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "LECTURE_SEULE" });
      loadUsers();
    }
  }

  const columns: Column<UserData>[] = [
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, accessor: (r) => r.name },
    { key: "email", header: "Email", accessor: (r) => r.email },
    { key: "role", header: "Rôle", accessor: (r) => <Badge variant="info">{roleLabels[r.role] || r.role}</Badge> },
    { key: "active", header: "Actif", accessor: (r) => (
      <span className={r.active ? "text-emerald-600" : "text-red-600"}>{r.active ? "Oui" : "Non"}</span>
    )},
    { key: "created", header: "Créé le", accessor: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Nouvel utilisateur</Button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <DataTable data={users} columns={columns} searchable searchFn={(r, q) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)} />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvel utilisateur">
        <div className="space-y-4">
          <Input label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Mot de passe" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Select label="Rôle" options={roleOptions} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleCreate}>Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
