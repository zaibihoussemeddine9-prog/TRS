"use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { OEEGauge } from "@/components/dashboard/oee-gauge";
import { OEEBarChart } from "@/components/charts/oee-bar-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { DowntimePieChart } from "@/components/charts/downtime-pie-chart";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { formatPercent } from "@/lib/trs-calculations";

interface DashboardData {
  global: { availability: number; performance: number; quality: number; oee: number };
  lineKPIs: { lineId: string; lineName: string; lineCode: string; oee: number; availability: number; performance: number; quality: number; entryCount: number }[];
  dailyTrend: { date: string; oee: number; availability: number; performance: number; quality: number }[];
  downtimeByCause: { name: string; total: number; count: number }[];
  totalDowntime: number;
  totalRejects: number;
  totalProduced: number;
  rejectRate: number;
  downtimeCount: number;
  entryCount: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const dateTo = new Date().toISOString().split("T")[0];
      const dateFrom = new Date(Date.now() - parseInt(period) * 86400000).toISOString().split("T")[0];
      const res = await fetch(`/api/dashboard?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    fetchData();
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const periodOptions = [
    { value: "1", label: "Aujourd'hui" },
    { value: "7", label: "7 derniers jours" },
    { value: "30", label: "30 derniers jours" },
    { value: "90", label: "3 mois" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Global</h1>
          <p className="text-sm text-slate-500">Vue d&apos;ensemble de la performance des lignes</p>
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={periodOptions}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
      </div>

      {/* OEE Gauge + Global KPIs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="flex items-center justify-center p-6 lg:col-span-1">
          <OEEGauge value={data.global.oee} />
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:col-span-4">
          <KPICard title="Disponibilit\u00e9" value={data.global.availability} icon={<Clock className="h-5 w-5" />} />
          <KPICard title="Performance" value={data.global.performance} icon={<TrendingUp className="h-5 w-5" />} />
          <KPICard title="Qualit\u00e9" value={data.global.quality} greenMin={0.95} orangeMin={0.90} icon={<CheckCircle className="h-5 w-5" />} />
          <KPICard
            title="Taux de rejet"
            value={data.rejectRate}
            greenMin={0.98}
            orangeMin={0.95}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Arr\u00eats" value={data.downtimeCount} isPercent={false} icon={<AlertTriangle className="h-5 w-5" />} />
        <KPICard title="Temps d'arr\u00eat total" value={Math.round(data.totalDowntime)} isPercent={false} unit="min" icon={<Clock className="h-5 w-5" />} />
        <KPICard title="Quantit\u00e9 produite" value={Math.round(data.totalProduced)} isPercent={false} unit="u" icon={<Package className="h-5 w-5" />} />
        <KPICard title="Saisies" value={data.entryCount} isPercent={false} icon={<CheckCircle className="h-5 w-5" />} />
      </div>

      {/* Trend + Bar chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">\u00c9volution du TRS</h3>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={data.dailyTrend} target={0.85} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">TRS par ligne</h3>
          </CardHeader>
          <CardContent>
            <OEEBarChart
              data={data.lineKPIs.map((l) => ({
                name: l.lineCode,
                oee: l.oee,
                availability: l.availability,
                performance: l.performance,
                quality: l.quality,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Downtime pie + Line table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">R\u00e9partition des arr\u00eats</h3>
          </CardHeader>
          <CardContent>
            <DowntimePieChart
              data={data.downtimeByCause.slice(0, 8).map((d) => ({
                name: d.name,
                value: Math.round(d.total),
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Performance par ligne</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lineKPIs.map((line) => (
                <div key={line.lineId} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{line.lineName}</p>
                    <p className="text-xs text-slate-500">{line.entryCount} entr\u00e9es</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Dispo</p>
                      <p className="font-semibold">{formatPercent(line.availability)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Perf</p>
                      <p className="font-semibold">{formatPercent(line.performance)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Qual</p>
                      <p className="font-semibold">{formatPercent(line.quality)}</p>
                    </div>
                    <Badge
                      variant={line.oee >= 0.85 ? "success" : line.oee >= 0.65 ? "warning" : "danger"}
                    >
                      TRS {formatPercent(line.oee)}
                    </Badge>
                  </div>
                </div>
              ))}
              {data.lineKPIs.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">Aucune donn\u00e9e pour cette p\u00e9riode</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
