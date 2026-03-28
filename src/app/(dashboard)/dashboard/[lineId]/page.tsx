"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { KPICard } from "@/components/dashboard/kpi-card";
import { OEEGauge } from "@/components/dashboard/oee-gauge";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { ParetoChart } from "@/components/charts/pareto-chart";
import { DowntimePieChart } from "@/components/charts/downtime-pie-chart";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Layers,
  Package,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { formatPercent, formatMinutesToHM } from "@/lib/trs-calculations";
import { formatDate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DashboardData {
  global: { availability: number; performance: number; quality: number; oee: number };
  production: { totalProduced: number; totalTarget: number; completionRate: number };
  rejects: { totalRejects: number; rejectRate: number };
  downtime: { totalMinutes: number; count: number; microStopMinutes: number };
  batches: { total: number; open: number; closed: number };
  lineKPIs: {
    lineId: string; lineName: string; lineCode: string;
    availability: number; performance: number; quality: number; oee: number;
    totalProduced: number; totalTarget: number; totalDowntime: number;
    downtimeCount: number; entryCount: number; openCount: number;
  }[];
  dailyTrend: { date: string; availability: number; performance: number; quality: number; oee: number }[];
  downtimeByCause: { name: string; total: number; count: number }[];
  downtimeBySubCause: { name: string; category: string; total: number; count: number }[];
  realtime: {
    id: string; lot: string; lineName: string; lineCode: string;
    productName: string; productCode: string; startTime: string;
    totalProduced: number; activeDowntimes: number;
  }[];
  entryCount: number;
}

interface Batch {
  id: string;
  lot: string;
  date: string;
  status: string;
  totalProduced?: number;
  product?: { name: string; code: string };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const periodOptions = [
  { value: "1", label: "Aujourd'hui" },
  { value: "7", label: "7 jours" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "3 mois" },
];

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function LineDashboardPage() {
  const params = useParams();
  const lineId = params.lineId as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [lineName, setLineName] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const dateTo = new Date().toISOString().split("T")[0];
      const dateFrom = new Date(Date.now() - parseInt(period) * 86400000)
        .toISOString()
        .split("T")[0];

      const [dashRes, prodRes, lineRes] = await Promise.all([
        fetch(`/api/dashboard?lineId=${lineId}&dateFrom=${dateFrom}&dateTo=${dateTo}`),
        fetch(`/api/production?lineId=${lineId}&dateFrom=${dateFrom}`),
        fetch(`/api/lines`),
      ]);

      const [dashData, prodData, linesData] = await Promise.all([
        dashRes.json(),
        prodRes.json(),
        lineRes.json(),
      ]);

      setData(dashData);
      setBatches(prodData);
      const line = linesData.find((l: { id: string; name: string }) => l.id === lineId);
      setLineName(line?.name || lineId);
      setLoading(false);
    }
    load();
  }, [lineId, period]);

  /* ── Loading state ────────────────────────────────────────────── */

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const completionPct =
    data.production.totalTarget > 0
      ? Math.min((data.production.totalProduced / data.production.totalTarget) * 100, 100)
      : 0;

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6 px-1 sm:px-0">
      {/* ── En-tête ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-1 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard Global
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Ligne : {lineName}
          </h1>
          <p className="text-sm text-slate-500">
            Performance détaillée de la ligne
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={periodOptions}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
      </div>

      {/* ── KPIs : Jauge + cartes ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="flex items-center justify-center p-6 lg:col-span-1">
          <OEEGauge value={data.global.oee} />
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-4">
          <KPICard
            title="Disponibilité"
            value={data.global.availability}
            icon={<Clock className="h-5 w-5" />}
          />
          <KPICard
            title="Performance"
            value={data.global.performance}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KPICard
            title="Qualité"
            value={data.global.quality}
            greenMin={0.95}
            orangeMin={0.90}
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <KPICard
            title="Taux de rejet"
            value={data.rejects.rejectRate}
            greenMin={0.98}
            orangeMin={0.95}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* ── Cartes résumé ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Production */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">Production</p>
              <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                {Math.round(data.production.totalProduced).toLocaleString("fr-FR")}
                <span className="text-xs font-normal text-slate-400 sm:text-sm">
                  {" / "}
                  {Math.round(data.production.totalTarget).toLocaleString("fr-FR")}
                </span>
              </p>
            </div>
            <Package className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Complétion</span>
              <span>{completionPct.toFixed(1)} %</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Arrêts */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">Arrêts</p>
              <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                {data.downtime.count}
                <span className="ml-1 text-xs font-normal text-slate-400 sm:text-sm">arrêts</span>
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            {formatMinutesToHM(data.downtime.totalMinutes)} au total
          </p>
        </Card>

        {/* Lots */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">Lots</p>
              <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">{data.batches.total}</p>
            </div>
            <Layers className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            <span className="text-emerald-600">{data.batches.open} ouverts</span>
            {" · "}
            {data.batches.closed} clôturés
          </p>
        </Card>

        {/* Micro-arrêts */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">Micro-arrêts</p>
              <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                {formatMinutesToHM(data.downtime.microStopMinutes)}
              </p>
            </div>
            <Zap className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            {Math.round(data.downtime.microStopMinutes)} min cumulées
          </p>
        </Card>
      </div>

      {/* ── Graphiques (3 charts) ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">
              Tendance TRS journalière
            </h3>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={data.dailyTrend} target={0.85} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Pareto des pertes</h3>
          </CardHeader>
          <CardContent>
            <ParetoChart
              data={data.downtimeBySubCause.map((d) => ({
                name: d.name,
                value: Math.round(d.total),
              }))}
              unit="min"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Répartition arrêts</h3>
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
      </div>

      {/* ── Derniers lots ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">Derniers lots</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {batches.slice(0, 15).map((b) => (
              <Link
                key={b.id}
                href={`/production/${b.id}`}
                className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-slate-900">
                    {b.lot}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {formatDate(b.date)} &middot; {b.product?.name || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {b.totalProduced != null && (
                    <span className="text-sm text-slate-600">
                      {Math.round(b.totalProduced).toLocaleString("fr-FR")} u
                    </span>
                  )}
                  <Badge variant={b.status === "OPEN" ? "success" : "default"}>
                    {b.status === "OPEN" ? "Ouvert" : "Clôturé"}
                  </Badge>
                </div>
              </Link>
            ))}
            {batches.length === 0 && (
              <p className="py-4 text-center text-slate-500">Aucun lot pour cette période</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
