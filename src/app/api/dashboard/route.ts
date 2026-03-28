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
    batchWhere.date = {};
    if (dateFrom) (batchWhere.date as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (batchWhere.date as Record<string, unknown>).lte = new Date(dateTo);
  }

  try {
    const batches = await prisma.batch.findMany({
      where: batchWhere,
      include: {
        line: true,
        product: true,
        shiftProductions: true,
        downtimeEvents: { include: { downtimeType: { include: { subCategory: { include: { category: true } } } } } },
      },
    });

    // Aggregate production per batch
    const batchStats = batches.map((b) => {
      const totalProduced = b.shiftProductions.reduce((s, sp) => s + sp.quantityProduced, 0);
      const totalConform = b.shiftProductions.reduce((s, sp) => s + sp.quantityConform, 0);
      const totalDowntime = b.downtimeEvents.reduce((s, de) => s + (de.duration || 0), 0);
      return { ...b, totalProduced, totalConform, totalDowntime };
    });

    const totalProduced = batchStats.reduce((s, b) => s + b.totalProduced, 0);
    const totalConform = batchStats.reduce((s, b) => s + b.totalConform, 0);
    const totalDowntime = batchStats.reduce((s, b) => s + b.totalDowntime, 0);
    const totalRejects = totalProduced - totalConform;

    const lines = await prisma.line.findMany({ where: { active: true } });
    const lineKPIs = lines.map((line) => {
      const lb = batchStats.filter((b) => b.lineId === line.id);
      const prod = lb.reduce((s, b) => s + b.totalProduced, 0);
      const conf = lb.reduce((s, b) => s + b.totalConform, 0);
      const quality = prod > 0 ? conf / prod : 0;
      return {
        lineId: line.id, lineName: line.name, lineCode: line.code,
        availability: 0, performance: 0, quality, oee: 0,
        entryCount: lb.length,
      };
    });

    // Daily trend
    const dailyMap = new Map<string, typeof batchStats>();
    batchStats.forEach((b) => {
      const key = new Date(b.date).toISOString().split("T")[0];
      if (!dailyMap.has(key)) dailyMap.set(key, []);
      dailyMap.get(key)!.push(b);
    });
    const dailyTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayBatches]) => {
        const prod = dayBatches.reduce((s, b) => s + b.totalProduced, 0);
        const conf = dayBatches.reduce((s, b) => s + b.totalConform, 0);
        return { date, availability: 0, performance: 0, quality: prod > 0 ? conf / prod : 0, oee: 0 };
      });

    // Downtime by cause
    const causeMap = new Map<string, { name: string; total: number; count: number }>();
    batchStats.forEach((b) => {
      b.downtimeEvents.forEach((de) => {
        const catName = de.downtimeType?.subCategory?.category?.name || "Autre";
        const ex = causeMap.get(catName) || { name: catName, total: 0, count: 0 };
        ex.total += de.duration || 0;
        ex.count += 1;
        causeMap.set(catName, ex);
      });
    });
    const downtimeByCause = Array.from(causeMap.values()).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      global: { availability: 0, performance: 0, quality: totalProduced > 0 ? totalConform / totalProduced : 0, oee: 0 },
      lineKPIs,
      dailyTrend,
      downtimeByCause,
      totalDowntime,
      totalRejects,
      totalProduced,
      rejectRate: totalProduced > 0 ? totalRejects / totalProduced : 0,
      downtimeCount: batchStats.reduce((s, b) => s + b.downtimeEvents.length, 0),
      entryCount: batches.length,
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}
