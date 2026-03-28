"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { KPICard } from "@/components/dashboard/kpi-card";
import { OEEGauge } from "@/components/dashboard/oee-gauge";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { ParetoChart } from "@/components/charts/pareto-chart";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calcAggregateOEE, formatPercent } from "@/lib/trs-calculations";
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
    const name = d.downtimeType?.name || "Inconnu";
    causeMap.set(name, (causeMap.get(name) || 0) + (d.duration || 0));
  });
  const paretoData = Array.from(causeMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));

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
          <KPICard title="Disponibilit\u00e9" value={oee.availability} icon={<Clock className="h-5 w-5" />} />
          <KPICard title="Performance" value={oee.performance} icon={<TrendingUp className="h-5 w-5" />} />
          <KPICard title="Qualit\u00e9" value={oee.quality} greenMin={0.95} orangeMin={0.90} icon={<CheckCircle className="h-5 w-5" />} />
          <KPICard title="Arr\u00eats" value={downtimes.length} isPercent={false} icon={<AlertTriangle className="h-5 w-5" />} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">\u00c9volution du TRS</h3></CardHeader>
          <CardContent><TrendLineChart data={dailyTrend} target={0.85} /></CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">Pareto des arr\u00eats</h3></CardHeader>
          <CardContent><ParetoChart data={paretoData} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold">Derniers arr\u00eats</h3></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {downtimes.slice(0, 10).map((d: any) => (
              <div key={d.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded border p-2 text-sm">
                <div>
                  <p className="font-medium">{d.downtimeType?.name || "Inconnu"}</p>
                  <p className="text-xs text-slate-500">{d.startTime ? new Date(d.startTime).toLocaleString("fr-FR") : "\u2014"}</p>
                </div>
                <Badge variant="info">
                  {d.duration ? `${Math.round(d.duration)} min` : "En cours"}
                </Badge>
              </div>
            ))}
            {downtimes.length === 0 && <p className="py-4 text-center text-slate-500">Aucun arr\u00eat</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
