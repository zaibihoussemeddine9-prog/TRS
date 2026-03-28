"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CheckCircle } from "lucide-react";

const DEPARTMENTS = [
  { value: "Production", label: "Production" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Qualité", label: "Qualité" },
  { value: "Logistique", label: "Logistique" },
  { value: "Direction", label: "Direction" },
  { value: "Autre", label: "Autre" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur", RESPONSABLE: "Responsable", OPERATEUR: "Opérateur", LECTURE_SEULE: "Lecture seule",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", department: "", position: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/users/me").then(r => r.json()).then(data => {
      setProfile(data);
      setForm({ firstName: data.firstName || "", lastName: data.lastName || "", department: data.department || "", position: data.position || "" });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile() {
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/users/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { setProfile(data); setSuccess("Profil mis à jour"); setTimeout(() => setSuccess(""), 4000); }
      else setError(data.error || "Erreur");
    } catch { setError("Erreur réseau"); } finally { setSubmitting(false); }
  }

  async function handleChangePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }
    if (pwForm.newPassword.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères"); return; }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/users/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      const data = await res.json();
      if (res.ok) { setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setSuccess("Mot de passe modifié"); setTimeout(() => setSuccess(""), 4000); }
      else setError(data.error || "Erreur");
    } catch { setError("Erreur réseau"); } finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!profile) return <div className="py-12 text-center text-slate-500">Profil introuvable</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {success && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4" />{success}</div>}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <UserAvatar firstName={profile.firstName} lastName={profile.lastName} name={profile.name} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="info">{ROLE_LABELS[profile.role] || profile.role}</Badge>
              {profile.department && <Badge variant="default">{profile.department}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Informations personnelles</h2></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Prénom" value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} disabled={submitting} />
            <Input label="Nom" value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} disabled={submitting} />
            <Select label="Département" options={DEPARTMENTS} placeholder="Sélectionner" value={form.department} onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))} disabled={submitting} />
            <Input label="Poste" value={form.position} onChange={(e) => setForm(p => ({ ...p, position: e.target.value }))} disabled={submitting} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveProfile} loading={submitting}>Enregistrer</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Changer le mot de passe</h2></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input label="Mot de passe actuel" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} disabled={submitting} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Nouveau mot de passe" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))} disabled={submitting} />
              <Input label="Confirmer" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} disabled={submitting} />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleChangePassword} loading={submitting}>Changer le mot de passe</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
