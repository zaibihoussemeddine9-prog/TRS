import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const lineId = searchParams.get("lineId");

  const batchWhere: Record<string, unknown> = {};
  if (lineId) batchWhere.lineId = lineId;
  if (dateFrom || dateTo) {
    batchWhere.startTime = {};
    if (dateFrom) (batchWhere.startTime as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      (batchWhere.startTime as Record<string, unknown>).lte = endOfDay;
    }
  }

  try {
    const batches = await prisma.batch.findMany({
      where: batchWhere,
      include: {
        line: true,
        product: true,
        productionDeclarations: true,
        downtimeEvents: { include: { subCategory: { include: { category: true } } } },
      },
    });

    // Aggregate per batch using stored TRS from declarations
    const batchStats = batches.map((b) => {
      const decls = b.productionDeclarations;
      const totalProduced = decls.reduce((s, d) => s + d.quantityProduced, 0);
      const totalMicroStops = decls.reduce((s, d) => s + (d.microStopMinutes || 0), 0);
      const totalDowntime = b.downtimeEvents.reduce((s, e) => s + (e.duration || 0), 0);

      // Weighted OEE from declarations
      const totalPlanned = decls.reduce((s, d) => s + (d.plannedMinutes || 0), 0);
      const weightedOEE = totalPlanned > 0
        ? decls.reduce((s, d) => s + (d.oee || 0) * (d.plannedMinutes || 0), 0) / totalPlanned
        : 0;
      const weightedAvail = totalPlanned > 0
        ? decls.reduce((s, d) => s + (d.availability || 0) * (d.plannedMinutes || 0), 0) / totalPlanned
        : 0;
      const weightedPerf = totalPlanned > 0
        ? decls.reduce((s, d) => s + (d.performance || 0) * (d.plannedMinutes || 0), 0) / totalPlanned
        : 0;

      return { ...b, totalProduced, totalMicroStops, totalDowntime, oee: weightedOEE, availability: weightedAvail, performance: weightedPerf, totalPlanned };
    });

    // Global aggregation
    const totalProduced = batchStats.reduce((s, b) => s + b.totalProduced, 0);
    const totalDowntime = batchStats.reduce((s, b) => s + b.totalDowntime, 0);
    const totalPlanned = batchStats.reduce((s, b) => s + b.totalPlanned, 0);
    const globalOEE = totalPlanned > 0 ? batchStats.reduce((s, b) => s + b.oee * b.totalPlanned, 0) / totalPlanned : 0;
    const globalAvail = totalPlanned > 0 ? batchStats.reduce((s, b) => s + b.availability * b.totalPlanned, 0) / totalPlanned : 0;
    const globalPerf = totalPlanned > 0 ? batchStats.reduce((s, b) => s + b.performance * b.totalPlanned, 0) / totalPlanned : 0;

    // Per-line KPIs
    const lines = await prisma.line.findMany({ where: { active: true } });
    const lineKPIs = lines.map((line) => {
      const lb = batchStats.filter((b) => b.lineId === line.id);
      const linePlanned = lb.reduce((s, b) => s + b.totalPlanned, 0);
      const lineOEE = linePlanned > 0 ? lb.reduce((s, b) => s + b.oee * b.totalPlanned, 0) / linePlanned : 0;
      const lineAvail = linePlanned > 0 ? lb.reduce((s, b) => s + b.availability * b.totalPlanned, 0) / linePlanned : 0;
      const linePerf = linePlanned > 0 ? lb.reduce((s, b) => s + b.performance * b.totalPlanned, 0) / linePlanned : 0;
      return {
        lineId: line.id, lineName: line.name, lineCode: line.code,
        availability: lineAvail, performance: linePerf, quality: 1, oee: lineOEE,
        entryCount: lb.length,
      };
    });

    // Daily trend
    const dailyMap = new Map<string, typeof batchStats>();
    batchStats.forEach((b) => {
      const key = new Date(b.startTime).toISOString().split("T")[0];
      if (!dailyMap.has(key)) dailyMap.set(key, []);
      dailyMap.get(key)!.push(b);
    });
    const dailyTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayBatches]) => {
        const dayPlanned = dayBatches.reduce((s, b) => s + b.totalPlanned, 0);
        const dayOEE = dayPlanned > 0 ? dayBatches.reduce((s, b) => s + b.oee * b.totalPlanned, 0) / dayPlanned : 0;
        const dayAvail = dayPlanned > 0 ? dayBatches.reduce((s, b) => s + b.availability * b.totalPlanned, 0) / dayPlanned : 0;
        const dayPerf = dayPlanned > 0 ? dayBatches.reduce((s, b) => s + b.performance * b.totalPlanned, 0) / dayPlanned : 0;
        return { date, availability: dayAvail, performance: dayPerf, quality: 1, oee: dayOEE };
      });

    // Downtime by category
    const causeMap = new Map<string, { name: string; total: number; count: number }>();
    batchStats.forEach((b) => {
      b.downtimeEvents.forEach((e) => {
        const name = e.subCategory?.category?.name || "Autre";
        const ex = causeMap.get(name) || { name, total: 0, count: 0 };
        ex.total += e.duration || 0;
        ex.count += 1;
        causeMap.set(name, ex);
      });
    });
    const downtimeByCause = Array.from(causeMap.values()).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      global: { availability: globalAvail, performance: globalPerf, quality: 1, oee: globalOEE },
      lineKPIs, dailyTrend, downtimeByCause,
      totalDowntime, totalRejects: 0, totalProduced,
      rejectRate: 0,
      downtimeCount: batchStats.reduce((s, b) => s + b.downtimeEvents.length, 0),
      entryCount: batches.length,
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}
