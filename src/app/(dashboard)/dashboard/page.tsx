"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { KPICard } from "@/components/dashboard/kpi-card";
import { OEEGauge } from "@/components/dashboard/oee-gauge";
import { OEEBarChart } from "@/components/charts/oee-bar-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { ParetoChart } from "@/components/charts/pareto-chart";
import { DowntimePieChart } from "@/components/charts/downtime-pie-chart";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  Package,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { formatPercent, formatMinutesToHM, getKPIColor } from "@/lib/trs-calculations";

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

type LineKPI = DashboardData["lineKPIs"][number];

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const periodOptions = [
  { value: "1", label: "Aujourd'hui" },
  { value: "7", label: "7 jours" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "3 mois" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function elapsedLabel(startTime: string): string {
  const ms = Date.now() - new Date(startTime).getTime();
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const dateTo = new Date().toISOString().split("T")[0];
      const dateFrom = new Date(Date.now() - parseInt(period) * 86400000)
        .toISOString()
        .split("T")[0];
      const res = await fetch(`/api/dashboard?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    fetchData();
  }, [period]);

  /* ── DataTable columns ────────────────────────────────────────── */

  const lineColumns = useMemo<Column<LineKPI>[]>(
    () => [
      {
        key: "line",
        header: "Ligne",
        sortable: true,
        sortValue: (r) => r.lineName,
        accessor: (r) => (
          <Link
            href={`/dashboard/${r.lineId}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {r.lineName}
          </Link>
        ),
      },
      {
        key: "oee",
        header: "TRS",
        sortable: true,
        sortValue: (r) => r.oee,
        className: "text-center",
        accessor: (r) => (
          <Badge variant={r.oee >= 0.85 ? "success" : r.oee >= 0.65 ? "warning" : "danger"}>
            {formatPercent(r.oee)}
          </Badge>
        ),
      },
      {
        key: "availability",
        header: "Dispo",
        sortable: true,
        sortValue: (r) => r.availability,
        className: "text-center hidden sm:table-cell",
        accessor: (r) => formatPercent(r.availability),
      },
      {
        key: "performance",
        header: "Perf",
        sortable: true,
        sortValue: (r) => r.performance,
        className: "text-center hidden sm:table-cell",
        accessor: (r) => formatPercent(r.performance),
      },
      {
        key: "quality",
        header: "Qualité",
        sortable: true,
        sortValue: (r) => r.quality,
        className: "text-center hidden md:table-cell",
        accessor: (r) => formatPercent(r.quality),
      },
      {
        key: "production",
        header: "Production / Objectif",
        sortable: true,
        sortValue: (r) => r.totalProduced,
        className: "hidden md:table-cell",
        accessor: (r) => (
          <span>
            {Math.round(r.totalProduced).toLocaleString("fr-FR")}
            {" / "}
            {Math.round(r.totalTarget).toLocaleString("fr-FR")}
          </span>
        ),
      },
      {
        key: "downtime",
        header: "Arrêts",
        sortable: true,
        sortValue: (r) => r.totalDowntime,
        className: "hidden lg:table-cell",
        accessor: (r) => (
          <span>
            {r.downtimeCount} &middot; {formatMinutesToHM(r.totalDowntime)}
          </span>
        ),
      },
      {
        key: "batches",
        header: "Lots",
        sortable: true,
        sortValue: (r) => r.entryCount,
        className: "text-center hidden lg:table-cell",
        accessor: (r) => (
          <span>
            {r.entryCount}
            {r.openCount > 0 && (
              <span className="ml-1 text-emerald-600">({r.openCount} ouv.)</span>
            )}
          </span>
        ),
      },
    ],
    [],
  );

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
      {/* ── Section 1 : En-tête + KPIs ─────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Global</h1>
          <p className="text-sm text-slate-500">
            Vue d&apos;ensemble de la performance des lignes
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

      {/* OEE Gauge + 4 KPI cards */}
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

      {/* 4 summary cards */}
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

      {/* ── Section 2 : Lots en cours (temps réel) ────────────── */}
      {data.realtime.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">
                Lots en cours ({data.realtime.length})
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 space-y-2 overflow-y-auto -mx-1 px-1">
              {data.realtime.map((r) => (
                <Link
                  key={r.id}
                  href={`/production/${r.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-slate-900">
                      {r.lot}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {r.lineName} &middot; {r.productName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
                    <span className="whitespace-nowrap text-slate-600">
                      {Math.round(r.totalProduced).toLocaleString("fr-FR")} u
                    </span>
                    {r.activeDowntimes > 0 ? (
                      <Badge variant="danger">{r.activeDowntimes} arrêt(s)</Badge>
                    ) : (
                      <Badge variant="success">En marche</Badge>
                    )}
                    <span className="whitespace-nowrap text-xs text-slate-400">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {elapsedLabel(r.startTime)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 3 : Graphiques (2x2) ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
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

      {/* ── Section 4 : Performance par ligne (DataTable) ─────── */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">Performance par ligne</h3>
        </CardHeader>
        <CardContent>
          <DataTable<LineKPI>
            data={data.lineKPIs}
            columns={lineColumns}
            pageSize={10}
            searchable
            searchFn={(row, q) =>
              row.lineName.toLowerCase().includes(q) ||
              row.lineCode.toLowerCase().includes(q)
            }
            emptyMessage="Aucune donnée pour cette période"
          />
        </CardContent>
      </Card>
    </div>
  );
}
