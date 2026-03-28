"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productionEntrySchema, ProductionEntryInput } from "@/lib/validations";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { calcOEE, formatPercent } from "@/lib/trs-calculations";

export default function NewProductionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [lines, setLines] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProductionEntryInput>({
    resolver: zodResolver(productionEntrySchema),
    defaultValues: {
      plannedDowntime: 0, unplannedDowntime: 0, formatChangeTime: 0,
      adjustmentTime: 0, cleaningTime: 0, qualityWaitTime: 0,
      maintenanceWaitTime: 0, materialWaitTime: 0, microStopTime: 0,
      quantityRejected: 0, status: "DRAFT",
    },
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/lines").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/shifts").then((r) => r.json()),
      fetch("/api/teams").then((r) => r.json()),
    ]).then(([l, p, s, t]) => {
      setLines(l);
      setProducts(p);
      setShifts(s);
      setTeams(t);
    });
  }, []);

  const watched = watch();
  const selectedProduct = products.find((p: any) => p.id === watched.productId);
  const formats = selectedProduct?.formats || [];

  const previewOEE = calcOEE({
    plannedTime: Number(watched.plannedTime) || 0,
    plannedUsefulTime: Number(watched.plannedUsefulTime) || 0,
    actualRunningTime: Number(watched.actualRunningTime) || 0,
    plannedDowntime: Number(watched.plannedDowntime) || 0,
    unplannedDowntime: Number(watched.unplannedDowntime) || 0,
    formatChangeTime: Number(watched.formatChangeTime) || 0,
    adjustmentTime: Number(watched.adjustmentTime) || 0,
    cleaningTime: Number(watched.cleaningTime) || 0,
    qualityWaitTime: Number(watched.qualityWaitTime) || 0,
    maintenanceWaitTime: Number(watched.maintenanceWaitTime) || 0,
    materialWaitTime: Number(watched.materialWaitTime) || 0,
    microStopTime: Number(watched.microStopTime) || 0,
    theoreticalSpeed: Number(watched.theoreticalSpeed) || 0,
    actualSpeed: Number(watched.actualSpeed) || 0,
    quantityProduced: Number(watched.quantityProduced) || 0,
    quantityConform: Number(watched.quantityConform) || 0,
    quantityRejected: Number(watched.quantityRejected) || 0,
  });

  async function onSubmit(data: ProductionEntryInput) {
    setSubmitting(true);
    const res = await fetch("/api/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, userId: session?.user?.id }),
    });
    if (res.ok) {
      router.push("/production");
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle saisie production</h1>
        <p className="text-sm text-slate-500">Remplissez les données de production du shift</p>
      </div>

      {/* Live OEE preview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Disponibilité", value: previewOEE.availability },
          { label: "Performance", value: previewOEE.performance },
          { label: "Qualité", value: previewOEE.quality },
          { label: "TRS", value: previewOEE.oee },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-white p-3 text-center">
            <p className="text-xs text-slate-500">{kpi.label}</p>
            <p className="text-lg sm:text-xl font-bold text-blue-600">{formatPercent(kpi.value)}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><h3 className="font-semibold">Identification</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input id="date" type="date" label="Date" error={errors.date?.message} {...register("date")} />
              <Select id="lineId" label="Ligne" options={lines.map((l: any) => ({ value: l.id, label: l.name }))} placeholder="Sélectionner" error={errors.lineId?.message} {...register("lineId")} />
              <Select id="shiftId" label="Shift" options={shifts.map((s: any) => ({ value: s.id, label: s.name }))} placeholder="Sélectionner" error={errors.shiftId?.message} {...register("shiftId")} />
              <Select id="teamId" label="Équipe" options={teams.map((t: any) => ({ value: t.id, label: t.name }))} placeholder="Sélectionner (optionnel)" {...register("teamId")} />
              <Select id="productId" label="Produit" options={products.map((p: any) => ({ value: p.id, label: p.name }))} placeholder="Sélectionner" error={errors.productId?.message} {...register("productId")} />
              <Select id="formatId" label="Format" options={formats.map((f: any) => ({ value: f.id, label: f.name }))} placeholder="Sélectionner" error={errors.formatId?.message} {...register("formatId")} />
              <Input id="lot" label="N° Lot" error={errors.lot?.message} {...register("lot")} />
              <Input id="orderNumber" label="N° OF / OC" {...register("orderNumber")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold">Temps (en minutes)</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Input id="plannedTime" type="number" step="0.1" label="Temps planifié" error={errors.plannedTime?.message} {...register("plannedTime")} />
              <Input id="plannedUsefulTime" type="number" step="0.1" label="Temps utile planifié" error={errors.plannedUsefulTime?.message} {...register("plannedUsefulTime")} />
              <Input id="actualRunningTime" type="number" step="0.1" label="Temps fonctionnement réel" error={errors.actualRunningTime?.message} {...register("actualRunningTime")} />
              <Input id="plannedDowntime" type="number" step="0.1" label="Arrêt planifié" {...register("plannedDowntime")} />
              <Input id="unplannedDowntime" type="number" step="0.1" label="Arrêt non planifié" {...register("unplannedDowntime")} />
              <Input id="formatChangeTime" type="number" step="0.1" label="Changement format" {...register("formatChangeTime")} />
              <Input id="adjustmentTime" type="number" step="0.1" label="Réglage" {...register("adjustmentTime")} />
              <Input id="cleaningTime" type="number" step="0.1" label="Nettoyage" {...register("cleaningTime")} />
              <Input id="qualityWaitTime" type="number" step="0.1" label="Attente qualité" {...register("qualityWaitTime")} />
              <Input id="maintenanceWaitTime" type="number" step="0.1" label="Attente maintenance" {...register("maintenanceWaitTime")} />
              <Input id="materialWaitTime" type="number" step="0.1" label="Attente matières/AC" {...register("materialWaitTime")} />
              <Input id="microStopTime" type="number" step="0.1" label="Micro-arrêts" {...register("microStopTime")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold">Vitesses et quantités</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Input id="theoreticalSpeed" type="number" step="0.1" label="Vitesse théorique (u/min)" error={errors.theoreticalSpeed?.message} {...register("theoreticalSpeed")} />
              <Input id="actualSpeed" type="number" step="0.1" label="Vitesse réelle (u/min)" error={errors.actualSpeed?.message} {...register("actualSpeed")} />
              <Input id="quantityProduced" type="number" step="1" label="Quantité produite" error={errors.quantityProduced?.message} {...register("quantityProduced")} />
              <Input id="quantityConform" type="number" step="1" label="Quantité conforme" error={errors.quantityConform?.message} {...register("quantityConform")} />
              <Input id="quantityRejected" type="number" step="1" label="Quantité rejetée" {...register("quantityRejected")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold">Commentaire</h3></CardHeader>
          <CardContent>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Commentaire opérateur / superviseur..."
              {...register("comment")}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={submitting}>Enregistrer</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
