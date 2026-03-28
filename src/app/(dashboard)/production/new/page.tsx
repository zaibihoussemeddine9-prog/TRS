"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/trs-calculations";

const SHIFTS = [
  { value: "Matin", label: "Matin" },
  { value: "Apr\u00e8s-midi", label: "Apr\u00e8s-midi" },
  { value: "Nuit", label: "Nuit" },
];

export default function NewProductionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [lines, setLines] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    date: "", lineId: "", productId: "", lot: "", shift: "", orderNumber: "",
    plannedTime: "", actualRunningTime: "", theoreticalSpeed: "", actualSpeed: "",
    quantityProduced: "", quantityConform: "", quantityRejected: "", comment: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/lines").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([l, p]) => { setLines(l); setProducts(p); });
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Live OEE preview
  const planned = Number(form.plannedTime) || 0;
  const running = Number(form.actualRunningTime) || 0;
  const thSpeed = Number(form.theoreticalSpeed) || 0;
  const produced = Number(form.quantityProduced) || 0;
  const conform = Number(form.quantityConform) || 0;

  const availability = planned > 0 ? running / planned : 0;
  const performance = running > 0 && thSpeed > 0 ? produced / (running * thSpeed) : 0;
  const quality = produced > 0 ? conform / produced : 0;
  const oee = availability * performance * quality;

  async function handleSubmit() {
    if (!form.date || !form.lineId || !form.productId || !form.lot.trim()) {
      setError("Date, ligne, produit et lot sont requis"); return;
    }
    setSubmitting(true); setError("");
    try {
      const payload = {
        date: form.date, lineId: form.lineId, productId: form.productId,
        lot: form.lot.trim(), shift: form.shift || null, orderNumber: form.orderNumber || null,
        plannedTime: form.plannedTime ? Number(form.plannedTime) : null,
        actualRunningTime: form.actualRunningTime ? Number(form.actualRunningTime) : null,
        theoreticalSpeed: form.theoreticalSpeed ? Number(form.theoreticalSpeed) : null,
        actualSpeed: form.actualSpeed ? Number(form.actualSpeed) : null,
        quantityProduced: form.quantityProduced ? Number(form.quantityProduced) : null,
        quantityConform: form.quantityConform ? Number(form.quantityConform) : null,
        quantityRejected: form.quantityRejected ? Number(form.quantityRejected) : null,
        comment: form.comment || null,
        userId: session?.user?.id,
      };
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { router.push("/production"); } else {
        const data = await res.json();
        setError(data.error || "Erreur");
      }
    } catch { setError("Erreur r\u00e9seau"); } finally { setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle saisie production</h1>
        <p className="text-sm text-slate-500">Remplissez les donn\u00e9es de production du shift</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Live OEE preview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Disponibilit\u00e9", value: availability },
          { label: "Performance", value: performance },
          { label: "Qualit\u00e9", value: quality },
          { label: "TRS", value: oee },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-white p-3 text-center">
            <p className="text-xs text-slate-500">{kpi.label}</p>
            <p className="text-lg sm:text-xl font-bold text-blue-600">{formatPercent(kpi.value)}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><h3 className="font-semibold">Identification</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input label="Date *" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            <Select label="Ligne *" options={lines.map((l) => ({ value: l.id, label: l.name }))} placeholder="S\u00e9lectionner" value={form.lineId} onChange={(e) => set("lineId", e.target.value)} />
            <Select label="Produit *" options={products.map((p) => ({ value: p.id, label: p.name }))} placeholder="S\u00e9lectionner" value={form.productId} onChange={(e) => set("productId", e.target.value)} />
            <Input label="N\u00b0 Lot *" value={form.lot} onChange={(e) => set("lot", e.target.value)} />
            <Select label="Shift" options={SHIFTS} placeholder="S\u00e9lectionner" value={form.shift} onChange={(e) => set("shift", e.target.value)} />
            <Input label="N\u00b0 OF / OC" value={form.orderNumber} onChange={(e) => set("orderNumber", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold">Temps (en minutes)</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Input label="Temps planifi\u00e9" type="number" step="0.1" value={form.plannedTime} onChange={(e) => set("plannedTime", e.target.value)} />
            <Input label="Temps fonctionnement r\u00e9el" type="number" step="0.1" value={form.actualRunningTime} onChange={(e) => set("actualRunningTime", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold">Vitesses et quantit\u00e9s</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Input label="Vitesse th\u00e9orique (u/min)" type="number" step="0.1" value={form.theoreticalSpeed} onChange={(e) => set("theoreticalSpeed", e.target.value)} />
            <Input label="Vitesse r\u00e9elle (u/min)" type="number" step="0.1" value={form.actualSpeed} onChange={(e) => set("actualSpeed", e.target.value)} />
            <Input label="Quantit\u00e9 produite" type="number" step="1" value={form.quantityProduced} onChange={(e) => set("quantityProduced", e.target.value)} />
            <Input label="Quantit\u00e9 conforme" type="number" step="1" value={form.quantityConform} onChange={(e) => set("quantityConform", e.target.value)} />
            <Input label="Quantit\u00e9 rejet\u00e9e" type="number" step="1" value={form.quantityRejected} onChange={(e) => set("quantityRejected", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold">Commentaire</h3></CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="Commentaire op\u00e9rateur / superviseur..."
            value={form.comment}
            onChange={(e) => set("comment", e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} loading={submitting}>Enregistrer</Button>
        <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
      </div>
    </div>
  );
}
