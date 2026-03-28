"use client";

import { useEffect, useState } from "react";
import { ParetoChart } from "@/components/charts/pareto-chart";
import { DowntimePieChart } from "@/components/charts/downtime-pie-chart";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function AnalysisPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/downtimes").then((r) => r.json()).then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // By category
  const catMap = new Map<string, number>();
  events.forEach((e: any) => {
    const name = e.downtimeType?.subCategory?.category?.name || "Autre";
    catMap.set(name, (catMap.get(name) || 0) + (e.duration || 0));
  });
  const catData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  // By type
  const typeMap = new Map<string, number>();
  events.forEach((e: any) => {
    const name = e.downtimeType?.name || "Inconnu";
    typeMap.set(name, (typeMap.get(name) || 0) + (e.duration || 0));
  });
  const typeData = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  // By line
  const lineMap = new Map<string, number>();
  events.forEach((e: any) => {
    const name = e.batch?.line?.name || "N/A";
    lineMap.set(name, (lineMap.get(name) || 0) + (e.duration || 0));
  });
  const lineData = Array.from(lineMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  const total = events.reduce((s: number, e: any) => s + (e.duration || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analyse Pareto</h1>
        <p className="text-sm text-slate-500">Analyse des causes d'arrêt — Total : {Math.round(total)} min ({events.length} arrêts)</p>
      </div>
      {loading ? <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card><CardHeader><h3 className="text-lg font-semibold">Pareto par type d'arrêt</h3></CardHeader><CardContent><ParetoChart data={typeData} /></CardContent></Card>
          <Card><CardHeader><h3 className="text-lg font-semibold">Pareto par ligne</h3></CardHeader><CardContent><ParetoChart data={lineData} /></CardContent></Card>
          <Card><CardHeader><h3 className="text-lg font-semibold">Répartition par catégorie</h3></CardHeader><CardContent><DowntimePieChart data={catData} /></CardContent></Card>
        </div>
      )}
    </div>
  );
}
