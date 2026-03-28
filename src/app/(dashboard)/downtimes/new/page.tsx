"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function NewDowntimePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [batches, setBatches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    batchId: "", categoryId: "", subCategoryId: "",
    startTime: "", endTime: "", description: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/production?status=OPEN").then((r) => r.json()),
      fetch("/api/causes").then((r) => r.json()),
    ]).then(([b, c]) => { setBatches(b); setCategories(c); }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => {
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (k === "categoryId") next.subCategoryId = "";
      return next;
    });
  };

  const selectedCat = categories.find((c: any) => c.id === form.categoryId);
  const subCategories = selectedCat?.subCategories || [];

  async function handleSubmit() {
    if (!form.batchId || !form.subCategoryId || !form.startTime) {
      setError("Lot, sous-catégorie et heure début sont requis"); return;
    }
    if (!session?.user?.id) {
      setError("Utilisateur non reconnu. Veuillez vous reconnecter."); return;
    }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/downtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: form.batchId, subCategoryId: form.subCategoryId,
          startTime: form.startTime, endTime: form.endTime || undefined,
          description: form.description || undefined,
          userId: session.user.id,
        }),
      });
      const data = await res.json();
      if (res.ok) router.push("/downtimes");
      else setError(data.error || "Erreur");
    } catch { setError("Erreur réseau"); } finally { setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Déclarer un arrêt</h1>
        <p className="text-sm text-slate-500">Enregistrer un arrêt sur un lot en cours</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      <Card>
        <CardHeader><h3 className="font-semibold">Lot concerné</h3></CardHeader>
        <CardContent>
          <Select label="Lot en cours *" options={batches.map((b: any) => ({ value: b.id, label: `${b.lot} — ${b.line?.name} — ${b.product?.name}` }))} placeholder="Sélectionner un lot" value={form.batchId} onChange={(e) => set("batchId", e.target.value)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h3 className="font-semibold">Classification</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <Select label="Catégorie *" options={categories.map((c: any) => ({ value: c.id, label: c.name }))} placeholder="Sélectionner" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} />
            <Select label="Sous-catégorie *" options={subCategories.map((s: any) => ({ value: s.id, label: s.name }))} placeholder={form.categoryId ? "Sélectionner" : "Choisir d'abord une catégorie"} value={form.subCategoryId} onChange={(e) => set("subCategoryId", e.target.value)} disabled={!form.categoryId} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h3 className="font-semibold">Horaires</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Début *" type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
            <Input label="Fin" type="datetime-local" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h3 className="font-semibold">Description</h3></CardHeader>
        <CardContent>
          <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} placeholder="Description de l'arrêt..." value={form.description} onChange={(e) => set("description", e.target.value)} />
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button onClick={handleSubmit} loading={submitting}>Enregistrer l'arrêt</Button>
        <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
      </div>
    </div>
  );
}
