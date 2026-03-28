import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const lineId = searchParams.get("lineId");
  const productId = searchParams.get("productId");

  const batchWhere: Record<string, unknown> = {};
  if (lineId) batchWhere.lineId = lineId;
  if (productId) batchWhere.productId = productId;
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

    // Per-batch aggregation
    const batchStats = batches.map((b) => {
      const decls = b.productionDeclarations;
      const totalProduced = decls.reduce((s, d) => s + d.quantityProduced, 0);
      const totalMicroStops = decls.reduce((s, d) => s + (d.microStopMinutes || 0), 0);
      const totalDowntime = b.downtimeEvents.reduce((s, e) => s + (e.duration || 0), 0);
      const totalPlanned = decls.reduce((s, d) => s + (d.plannedMinutes || 0), 0);
      const totalTarget = decls.reduce((s, d) => s + (d.targetQuantity || 0), 0);

      // Weighted KPIs from declarations
      const w = (field: string) => totalPlanned > 0
        ? decls.reduce((s, d) => s + ((d as any)[field] || 0) * (d.plannedMinutes || 0), 0) / totalPlanned
        : 0;

      return {
        ...b, totalProduced, totalMicroStops, totalDowntime, totalPlanned, totalTarget,
        oee: w("oee"), availability: w("availability"), performance: w("performance"),
        quality: w("quality"),
      };
    });

    // Global
    const totalProduced = batchStats.reduce((s, b) => s + b.totalProduced, 0);
    const totalTarget = batchStats.reduce((s, b) => s + b.totalTarget, 0);
    const totalDowntime = batchStats.reduce((s, b) => s + b.totalDowntime, 0);
    const totalMicroStops = batchStats.reduce((s, b) => s + b.totalMicroStops, 0);
    const totalPlanned = batchStats.reduce((s, b) => s + b.totalPlanned, 0);

    const wGlobal = (field: string) => totalPlanned > 0
      ? batchStats.reduce((s, b) => s + (b as any)[field] * b.totalPlanned, 0) / totalPlanned
      : 0;

    const closedBatches = batchStats.filter(b => b.status === "CLOSED");
    const totalRejects = closedBatches.reduce((s, b) => s + (b.quantityRejected || 0), 0);

    // Per-line KPIs
    const lines = await prisma.line.findMany({ where: { active: true } });
    const lineKPIs = lines.map((line) => {
      const lb = batchStats.filter((b) => b.lineId === line.id);
      const lp = lb.reduce((s, b) => s + b.totalPlanned, 0);
      const wLine = (field: string) => lp > 0
        ? lb.reduce((s, b) => s + (b as any)[field] * b.totalPlanned, 0) / lp : 0;
      return {
        lineId: line.id, lineName: line.name, lineCode: line.code,
        availability: wLine("availability"), performance: wLine("performance"),
        quality: wLine("quality"), oee: wLine("oee"),
        totalProduced: lb.reduce((s, b) => s + b.totalProduced, 0),
        totalTarget: lb.reduce((s, b) => s + b.totalTarget, 0),
        totalDowntime: lb.reduce((s, b) => s + b.totalDowntime, 0),
        downtimeCount: lb.reduce((s, b) => s + b.downtimeEvents.length, 0),
        entryCount: lb.length,
        openCount: lb.filter(b => b.status === "OPEN").length,
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
      .map(([date, db]) => {
        const dp = db.reduce((s, b) => s + b.totalPlanned, 0);
        const wDay = (f: string) => dp > 0 ? db.reduce((s, b) => s + (b as any)[f] * b.totalPlanned, 0) / dp : 0;
        return { date, availability: wDay("availability"), performance: wDay("performance"), quality: wDay("quality"), oee: wDay("oee") };
      });

    // Downtime by category
    const causeMap = new Map<string, { name: string; total: number; count: number }>();
    const subCauseMap = new Map<string, { name: string; category: string; total: number; count: number }>();
    batchStats.forEach((b) => {
      b.downtimeEvents.forEach((e) => {
        const catName = e.subCategory?.category?.name || "Autre";
        const subName = e.subCategory?.name || "Autre";
        const dur = e.duration || 0;

        const cat = causeMap.get(catName) || { name: catName, total: 0, count: 0 };
        cat.total += dur; cat.count += 1;
        causeMap.set(catName, cat);

        const sub = subCauseMap.get(subName) || { name: subName, category: catName, total: 0, count: 0 };
        sub.total += dur; sub.count += 1;
        subCauseMap.set(subName, sub);
      });
    });

    // Real-time: open batches
    const openBatches = await prisma.batch.findMany({
      where: { status: "OPEN", ...(lineId ? { lineId } : {}) },
      include: {
        line: true, product: true,
        productionDeclarations: { select: { quantityProduced: true } },
        downtimeEvents: { where: { endTime: null }, select: { id: true, startTime: true } },
      },
      orderBy: { startTime: "desc" },
      take: 10,
    });

    const realtime = openBatches.map(b => ({
      id: b.id, lot: b.lot,
      lineName: b.line.name, lineCode: b.line.code,
      productName: b.product.name, productCode: b.product.code,
      startTime: b.startTime,
      totalProduced: b.productionDeclarations.reduce((s, d) => s + d.quantityProduced, 0),
      activeDowntimes: b.downtimeEvents.length,
    }));

    return NextResponse.json({
      global: { availability: wGlobal("availability"), performance: wGlobal("performance"), quality: wGlobal("quality"), oee: wGlobal("oee") },
      production: { totalProduced, totalTarget, completionRate: totalTarget > 0 ? totalProduced / totalTarget : 0 },
      rejects: { totalRejects, rejectRate: totalProduced > 0 ? totalRejects / (totalProduced + totalRejects) : 0 },
      downtime: { totalMinutes: totalDowntime, count: batchStats.reduce((s, b) => s + b.downtimeEvents.length, 0), microStopMinutes: totalMicroStops },
      batches: { total: batches.length, open: batches.filter(b => b.status === "OPEN").length, closed: closedBatches.length },
      lineKPIs,
      dailyTrend,
      downtimeByCause: Array.from(causeMap.values()).sort((a, b) => b.total - a.total),
      downtimeBySubCause: Array.from(subCauseMap.values()).sort((a, b) => b.total - a.total),
      realtime,
      entryCount: batchStats.reduce((s, b) => s + b.productionDeclarations.length, 0),
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}
