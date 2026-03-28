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
  const [causes, setCauses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    batchId: "", downtimeTypeId: "", startTime: "", endTime: "", duration: "", description: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/production").then((r) => r.json()),
      fetch("/api/causes").then((r) => r.json()),
    ]).then(([b, c]) => { setBatches(b); setCauses(c); });
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const batchOptions = batches.map((b: any) => ({
    value: b.id,
    label: `${b.lot} - ${b.line?.code || "?"} - ${b.date ? new Date(b.date).toLocaleDateString("fr-FR") : ""}`,
  }));

  const causeOptions = causes.map((c: any) => ({ value: c.id, label: c.name }));

  async function handleSubmit() {
    if (!form.batchId || !form.downtimeTypeId) {
      setError("Lot et type d'arrêt requis"); return;
    }
    setSubmitting(true); setError("");
    try {
      const payload = {
        batchId: form.batchId,
        downtimeTypeId: form.downtimeTypeId,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        duration: form.duration ? Number(form.duration) : null,
        description: form.description || null,
        userId: session?.user?.id,
      };
      const res = await fetch("/api/downtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { router.push("/downtimes"); } else {
        const data = await res.json();
        setError(data.error || "Erreur");
      }
    } catch { setError("Erreur réseau"); } finally { setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nouvel arrêt</h1>
        <p className="text-sm text-slate-500">Déclarer un arrêt de ligne</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardHeader><h3 className="font-semibold">Identification</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select label="Lot (Batch) *" options={batchOptions} placeholder="Sélectionner un lot" value={form.batchId} onChange={(e) => set("batchId", e.target.value)} />
            <Select label="Type d'arrêt *" options={causeOptions} placeholder="Sélectionner" value={form.downtimeTypeId} onChange={(e) => set("downtimeTypeId", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold">Temps</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input label="Début" type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
            <Input label="Fin" type="datetime-local" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
            <Input label="Durée (min)" type="number" step="0.1" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold">Détails</h3></CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} loading={submitting}>Enregistrer</Button>
        <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
      </div>
    </div>
  );
}
