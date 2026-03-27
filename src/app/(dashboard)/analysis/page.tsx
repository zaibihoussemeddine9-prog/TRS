"use client";

import { useEffect, useState } from "react";
import { ParetoChart } from "@/components/charts/pareto-chart";
import { DowntimePieChart } from "@/components/charts/downtime-pie-chart";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AnalysisPage() {
  const [downtimes, setDowntimes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLine, setFilterLine] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  useEffect(() => {
    fetch("/api/lines").then((r) => r.json()).then((data) =>
      setLines(data.map((l: any) => ({ value: l.id, label: l.name })))
    );
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterLine) params.set("lineId", filterLine);
      if (filterFrom) params.set("dateFrom", filterFrom);
      if (filterTo) params.set("dateTo", filterTo);
      const res = await fetch(`/api/downtimes?${params}`);
      setDowntimes(await res.json());
      setLoading(false);
    }
    load();
  }, [filterLine, filterFrom, filterTo]);

  // By cause
  const causeMap = new Map<string, number>();
  downtimes.forEach((d: any) => {
    const name = d.cause?.name || "Inconnu";
    causeMap.set(name, (causeMap.get(name) || 0) + (d.duration || 0));
  });
  const causeParetoData = Array.from(causeMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  // By responsibility
  const respMap = new Map<string, number>();
  const respLabels: Record<string, string> = {
    PRODUCTION: "Production", MAINTENANCE: "Maintenance", QUALITE: "Qualité", LOGISTIQUE: "Logistique", AUTRE: "Autre",
  };
  downtimes.forEach((d: any) => {
    const name = respLabels[d.responsibility] || d.responsibility;
    respMap.set(name, (respMap.get(name) || 0) + (d.duration || 0));
  });
  const respPieData = Array.from(respMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  // By type
  const typeMap = new Map<string, number>();
  downtimes.forEach((d: any) => {
    const name = d.type === "PLANNED" ? "Planifié" : "Non planifié";
    typeMap.set(name, (typeMap.get(name) || 0) + (d.duration || 0));
  });
  const typePieData = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  // By line
  const lineMap = new Map<string, number>();
  downtimes.forEach((d: any) => {
    const name = d.line?.code || d.line?.name || "N/A";
    lineMap.set(name, (lineMap.get(name) || 0) + (d.duration || 0));
  });
  const lineParetoData = Array.from(lineMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  const totalDowntime = downtimes.reduce((s: number, d: any) => s + (d.duration || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analyse Pareto</h1>
        <p className="text-sm text-slate-500">Analyse des causes de pertes et arrêts</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select options={lines} placeholder="Toutes les lignes" value={filterLine} onChange={(e) => setFilterLine(e.target.value)} />
        </div>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-40" />
        <div className="flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          Total : {Math.round(totalDowntime)} min ({downtimes.length} arrêts)
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><h3 className="text-lg font-semibold">Pareto par cause</h3></CardHeader>
            <CardContent><ParetoChart data={causeParetoData} /></CardContent>
          </Card>
          <Card>
            <CardHeader><h3 className="text-lg font-semibold">Pareto par ligne</h3></CardHeader>
            <CardContent><ParetoChart data={lineParetoData} /></CardContent>
          </Card>
          <Card>
            <CardHeader><h3 className="text-lg font-semibold">Répartition par responsabilité</h3></CardHeader>
            <CardContent><DowntimePieChart data={respPieData} /></CardContent>
          </Card>
          <Card>
            <CardHeader><h3 className="text-lg font-semibold">Répartition par type</h3></CardHeader>
            <CardContent><DowntimePieChart data={typePieData} /></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
