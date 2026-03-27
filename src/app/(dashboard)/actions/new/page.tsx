"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { actionPlanSchema, ActionPlanInput } from "@/lib/validations";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function NewActionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ActionPlanInput>({
    resolver: zodResolver(actionPlanSchema),
    defaultValues: { priority: "MEDIUM", status: "TODO", progress: 0 },
  });

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);

  async function onSubmit(data: ActionPlanInput) {
    setSubmitting(true);
    const res = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, userId: session?.user?.id }),
    });
    if (res.ok) router.push("/actions");
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle action</h1>
        <p className="text-sm text-slate-500">Créer un plan d'action correctif ou préventif</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><h3 className="font-semibold">Détails de l'action</h3></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input id="title" label="Titre" error={errors.title?.message} {...register("title")} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} {...register("description")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  id="assignedToId" label="Responsable"
                  options={users.map((u: any) => ({ value: u.id, label: u.name }))}
                  placeholder="Sélectionner"
                  error={errors.assignedToId?.message}
                  {...register("assignedToId")}
                />
                <Input id="targetDate" type="date" label="Date cible" error={errors.targetDate?.message} {...register("targetDate")} />
                <Select
                  id="priority" label="Priorité"
                  options={[
                    { value: "LOW", label: "Faible" },
                    { value: "MEDIUM", label: "Moyen" },
                    { value: "HIGH", label: "Élevé" },
                    { value: "CRITICAL", label: "Critique" },
                  ]}
                  {...register("priority")}
                />
                <Select
                  id="status" label="Statut"
                  options={[
                    { value: "TODO", label: "À faire" },
                    { value: "IN_PROGRESS", label: "En cours" },
                    { value: "DONE", label: "Terminé" },
                  ]}
                  {...register("status")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commentaire</label>
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={2} {...register("comment")} />
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
