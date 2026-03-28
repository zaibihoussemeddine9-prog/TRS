"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function NewProductionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [lines, setLines] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ date: "", lineId: "", productId: "", lot: "", orderNumber: "", comment: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/lines").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([l, p]) => { setLines(l); setProducts(p); }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.date || !form.lineId || !form.productId || !form.lot.trim()) {
      setError("Date, ligne, produit et lot sont requis"); return;
    }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: session?.user?.id }),
      });
      if (res.ok) router.push("/production");
      else { const data = await res.json(); setError(data.error || "Erreur"); }
    } catch { setError("Erreur réseau"); } finally { setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nouveau lot</h1>
        <p className="text-sm text-slate-500">Créer un lot de production</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      <Card>
        <CardHeader><h3 className="font-semibold">Identification du lot</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="N° Lot *" value={form.lot} onChange={(e) => set("lot", e.target.value)} />
            <Input label="Date *" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            <Select label="Ligne *" options={lines.map((l) => ({ value: l.id, label: l.name }))} placeholder="Sélectionner" value={form.lineId} onChange={(e) => set("lineId", e.target.value)} />
            <Select label="Produit *" options={products.map((p) => ({ value: p.id, label: p.name }))} placeholder="Sélectionner" value={form.productId} onChange={(e) => set("productId", e.target.value)} />
            <Input label="N° OF / OC" value={form.orderNumber} onChange={(e) => set("orderNumber", e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h3 className="font-semibold">Commentaire</h3></CardHeader>
        <CardContent>
          <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} placeholder="Commentaire..." value={form.comment} onChange={(e) => set("comment", e.target.value)} />
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button onClick={handleSubmit} loading={submitting}>Créer le lot</Button>
        <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
      </div>
    </div>
  );
}
