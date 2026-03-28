"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ParetoChart } from "@/components/charts/pareto-chart";
import { DowntimePieChart } from "@/components/charts/downtime-pie-chart";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Clock, AlertTriangle, Package, Layers } from "lucide-react";

export default function LineDashboardPage() {
  const params = useParams();
  const lineId = params.lineId as string;
  const [batches, setBatches] = useState<any[]>([]);
  const [downtimes, setDowntimes] = useState<any[]>([]);
  const [lineName, setLineName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const dateFrom = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const [prodRes, dtRes, lineRes] = await Promise.all([
        fetch(`/api/production?lineId=${lineId}&dateFrom=${dateFrom}`),
        fetch(`/api/downtimes?lineId=${lineId}&dateFrom=${dateFrom}`),
        fetch(`/api/lines`),
      ]);
      const [prodData, dtData, linesData] = await Promise.all([prodRes.json(), dtRes.json(), lineRes.json()]);
      setBatches(prodData);
      setDowntimes(dtData);
      const line = linesData.find((l: any) => l.id === lineId);
      setLineName(line?.name || lineId);
      setLoading(false);
    }
    load();
  }, [lineId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const totalDowntime = downtimes.reduce((s: number, d: any) => s + (d.duration || 0), 0);

  // Downtime pareto by type
  const typeMap = new Map<string, number>();
  downtimes.forEach((d: any) => {
    const name = d.subCategory?.name || "Inconnu";
    typeMap.set(name, (typeMap.get(name) || 0) + (d.duration || 0));
  });
  const typeParetoData = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  // Downtime by category
  const catMap = new Map<string, number>();
  downtimes.forEach((d: any) => {
    const name = d.subCategory?.category?.name || "Autre";
    catMap.set(name, (catMap.get(name) || 0) + (d.duration || 0));
  });
  const catData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ligne : {lineName}</h1>
        <p className="text-sm text-slate-500">Derniers 30 jours</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Lots" value={batches.length} isPercent={false} icon={<Layers className="h-5 w-5" />} />
        <KPICard title="Arrêts" value={downtimes.length} isPercent={false} icon={<AlertTriangle className="h-5 w-5" />} />
        <KPICard title="Temps d'arrêt total" value={Math.round(totalDowntime)} isPercent={false} unit="min" icon={<Clock className="h-5 w-5" />} />
        <KPICard title="Lots ouverts" value={batches.filter((b: any) => b.status === "OPEN").length} isPercent={false} icon={<Package className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">Pareto des arrêts par sous-catégorie</h3></CardHeader>
          <CardContent><ParetoChart data={typeParetoData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">Répartition par catégorie</h3></CardHeader>
          <CardContent><DowntimePieChart data={catData} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold">Derniers lots</h3></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {batches.slice(0, 10).map((b: any) => (
              <div key={b.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded border p-2 text-sm">
                <div>
                  <p className="font-mono font-medium">{b.lot}</p>
                  <p className="text-xs text-slate-500">{formatDate(b.date)} — {b.product?.name || "—"}</p>
                </div>
                <Badge variant={b.status === "OPEN" ? "success" : "default"}>
                  {b.status === "OPEN" ? "Ouvert" : "Clôturé"}
                </Badge>
              </div>
            ))}
            {batches.length === 0 && <p className="py-4 text-center text-slate-500">Aucun lot</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold">Derniers arrêts</h3></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {downtimes.slice(0, 10).map((d: any) => (
              <div key={d.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded border p-2 text-sm">
                <div>
                  <p className="font-medium">{d.subCategory?.name || "Inconnu"}</p>
                  <p className="text-xs text-slate-500">
                    {d.subCategory?.category?.name || ""}
                    {d.startTime ? ` — ${new Date(d.startTime).toLocaleString("fr-FR")}` : ""}
                  </p>
                </div>
                <Badge variant="info">
                  {d.duration ? `${Math.round(d.duration)} min` : "En cours"}
                </Badge>
              </div>
            ))}
            {downtimes.length === 0 && <p className="py-4 text-center text-slate-500">Aucun arrêt</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
