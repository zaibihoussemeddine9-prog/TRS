"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { KPICard } from "@/components/dashboard/kpi-card";
import { OEEGauge } from "@/components/dashboard/oee-gauge";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { ParetoChart } from "@/components/charts/pareto-chart";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calcAggregateOEE, formatPercent, formatMinutesToHM } from "@/lib/trs-calculations";
import { Clock, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";

export default function LineDashboardPage() {
  const params = useParams();
  const lineId = params.lineId as string;
  const [entries, setEntries] = useState<any[]>([]);
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
      setEntries(prodData);
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

  const oee = calcAggregateOEE(entries);

  // Daily trend
  const dailyMap = new Map<string, any[]>();
  entries.forEach((e: any) => {
    const key = new Date(e.date).toISOString().split("T")[0];
    if (!dailyMap.has(key)) dailyMap.set(key, []);
    dailyMap.get(key)!.push(e);
  });
  const dailyTrend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEntries]) => ({ date, ...calcAggregateOEE(dayEntries) }));

  // Downtime pareto
  const causeMap = new Map<string, number>();
  downtimes.forEach((d: any) => {
    const name = d.cause?.name || "Inconnu";
    causeMap.set(name, (causeMap.get(name) || 0) + (d.duration || 0));
  });
  const paretoData = Array.from(causeMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

  // Shift analysis
  const shiftMap = new Map<string, any[]>();
  entries.forEach((e: any) => {
    const key = e.shift?.name || "N/A";
    if (!shiftMap.has(key)) shiftMap.set(key, []);
    shiftMap.get(key)!.push(e);
  });

  const totalDowntime = downtimes.reduce((sum: number, d: any) => sum + (d.duration || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ligne : {lineName}</h1>
        <p className="text-sm text-slate-500">Derniers 30 jours</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="flex items-center justify-center p-6">
          <OEEGauge value={oee.oee} />
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:col-span-4">
          <KPICard title="Disponibilité" value={oee.availability} icon={<Clock className="h-5 w-5" />} />
          <KPICard title="Performance" value={oee.performance} icon={<TrendingUp className="h-5 w-5" />} />
          <KPICard title="Qualité" value={oee.quality} greenMin={0.95} orangeMin={0.90} icon={<CheckCircle className="h-5 w-5" />} />
          <KPICard title="Arrêts" value={downtimes.length} isPercent={false} icon={<AlertTriangle className="h-5 w-5" />} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">Évolution du TRS</h3></CardHeader>
          <CardContent><TrendLineChart data={dailyTrend} target={0.85} /></CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">Pareto des arrêts</h3></CardHeader>
          <CardContent><ParetoChart data={paretoData} /></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">Analyse par shift</h3></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(shiftMap.entries()).map(([shift, shiftEntries]) => {
                const shiftOee = calcAggregateOEE(shiftEntries);
                return (
                  <div key={shift} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3">
                    <span className="font-medium">{shift}</span>
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-sm">
                      <span>D: {formatPercent(shiftOee.availability)}</span>
                      <span>P: {formatPercent(shiftOee.performance)}</span>
                      <span>Q: {formatPercent(shiftOee.quality)}</span>
                      <Badge variant={shiftOee.oee >= 0.85 ? "success" : shiftOee.oee >= 0.65 ? "warning" : "danger"}>
                        {formatPercent(shiftOee.oee)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">Derniers arrêts</h3></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {downtimes.slice(0, 8).map((d: any) => (
                <div key={d.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded border p-2 text-sm">
                  <div>
                    <p className="font-medium">{d.cause?.name}</p>
                    <p className="text-xs text-slate-500">{new Date(d.startTime).toLocaleString("fr-FR")}</p>
                  </div>
                  <Badge variant={d.type === "PLANNED" ? "info" : "danger"}>
                    {d.duration ? `${Math.round(d.duration)} min` : "En cours"}
                  </Badge>
                </div>
              ))}
              {downtimes.length === 0 && <p className="py-4 text-center text-slate-500">Aucun arrêt</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
