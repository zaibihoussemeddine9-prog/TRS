"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { downtimeEntrySchema, DowntimeEntryInput } from "@/lib/validations";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function NewDowntimePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [lines, setLines] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [causes, setCauses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DowntimeEntryInput>({
    resolver: zodResolver(downtimeEntrySchema),
    defaultValues: { type: "UNPLANNED", responsibility: "PRODUCTION", status: "OPEN" },
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/lines").then((r) => r.json()),
      fetch("/api/shifts").then((r) => r.json()),
      fetch("/api/causes").then((r) => r.json()),
    ]).then(([l, s, c]) => {
      setLines(l);
      setShifts(s);
      setCauses(c);
    });
  }, []);

  const selectedCauseId = watch("causeId");
  const selectedCause = causes.find((c: any) => c.id === selectedCauseId);
  const subCauses = selectedCause?.subCauses || [];

  async function onSubmit(data: DowntimeEntryInput) {
    setSubmitting(true);
    const res = await fetch("/api/downtimes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, userId: session?.user?.id }),
    });
    if (res.ok) router.push("/downtimes");
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nouvel arrêt</h1>
        <p className="text-sm text-slate-500">Déclarer un arrêt de ligne</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><h3 className="font-semibold">Identification</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Select id="lineId" label="Ligne" options={lines.map((l: any) => ({ value: l.id, label: l.name }))} placeholder="Sélectionner" error={errors.lineId?.message} {...register("lineId")} />
              <Input id="date" type="date" label="Date" error={errors.date?.message} {...register("date")} />
              <Select id="shiftId" label="Shift" options={shifts.map((s: any) => ({ value: s.id, label: s.name }))} placeholder="Optionnel" {...register("shiftId")} />
              <Input id="startTime" type="datetime-local" label="Début" error={errors.startTime?.message} {...register("startTime")} />
              <Input id="endTime" type="datetime-local" label="Fin (optionnel)" {...register("endTime")} />
              <Input id="duration" type="number" step="0.1" label="Durée (min)" {...register("duration")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold">Classification</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                id="type" label="Type"
                options={[{ value: "PLANNED", label: "Planifié" }, { value: "UNPLANNED", label: "Non planifié" }]}
                error={errors.type?.message} {...register("type")}
              />
              <Select
                id="responsibility" label="Responsabilité"
                options={[
                  { value: "PRODUCTION", label: "Production" },
                  { value: "MAINTENANCE", label: "Maintenance" },
                  { value: "QUALITE", label: "Qualité" },
                  { value: "LOGISTIQUE", label: "Logistique" },
                  { value: "AUTRE", label: "Autre" },
                ]}
                error={errors.responsibility?.message} {...register("responsibility")}
              />
              <Select id="causeId" label="Cause principale" options={causes.map((c: any) => ({ value: c.id, label: c.name }))} placeholder="Sélectionner" error={errors.causeId?.message} {...register("causeId")} />
              <Select id="subCauseId" label="Sous-cause" options={subCauses.map((sc: any) => ({ value: sc.id, label: sc.name }))} placeholder="Optionnel" {...register("subCauseId")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold">Détails</h3></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} {...register("description")} />
              </div>
              <Input id="estimatedImpact" type="number" step="0.1" label="Impact estimé (unités perdues)" {...register("estimatedImpact")} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Action immédiate</label>
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={2} {...register("immediateAction")} />
              </div>
            </div>
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
