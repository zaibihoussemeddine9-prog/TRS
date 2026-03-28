import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcAggregateOEE, BatchData } from "@/lib/trs-calculations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const lineId = searchParams.get("lineId");

  const where: Record<string, unknown> = {};
  if (lineId) where.lineId = lineId;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo);
  }

  try {
    const batches = await prisma.batch.findMany({
      where,
      include: { line: true, product: true },
    });

    const toBatchData = (b: any): BatchData => ({
      plannedTime: b.plannedTime,
      actualRunningTime: b.actualRunningTime,
      theoreticalSpeed: b.theoreticalSpeed,
      quantityProduced: b.quantityProduced,
      quantityConform: b.quantityConform,
    });

    const globalOEE = calcAggregateOEE(batches.map(toBatchData));

    const lines = await prisma.line.findMany({ where: { active: true } });
    const lineKPIs = lines.map((line) => {
      const lb = batches.filter((b) => b.lineId === line.id);
      const oee = calcAggregateOEE(lb.map(toBatchData));
      return { lineId: line.id, lineName: line.name, lineCode: line.code, ...oee, entryCount: lb.length };
    });

    const dailyMap = new Map<string, typeof batches>();
    batches.forEach((b) => {
      const key = new Date(b.date).toISOString().split("T")[0];
      if (!dailyMap.has(key)) dailyMap.set(key, []);
      dailyMap.get(key)!.push(b);
    });
    const dailyTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayBatches]) => ({ date, ...calcAggregateOEE(dayBatches.map(toBatchData)) }));

    const downtimes = await prisma.downtime.findMany({
      where: lineId ? { batch: { lineId } } : {},
      include: { downtimeType: true },
    });

    const causeMap = new Map<string, { name: string; total: number; count: number }>();
    downtimes.forEach((d) => {
      const key = d.downtimeTypeId;
      const ex = causeMap.get(key) || { name: d.downtimeType.name, total: 0, count: 0 };
      ex.total += d.duration || 0;
      ex.count += 1;
      causeMap.set(key, ex);
    });
    const downtimeByCause = Array.from(causeMap.values()).sort((a, b) => b.total - a.total);

    const totalDowntime = downtimes.reduce((s, d) => s + (d.duration || 0), 0);
    const totalRejects = batches.reduce((s, b) => s + b.quantityRejected, 0);
    const totalProduced = batches.reduce((s, b) => s + b.quantityProduced, 0);

    return NextResponse.json({
      global: globalOEE,
      lineKPIs,
      dailyTrend,
      downtimeByCause,
      totalDowntime,
      totalRejects,
      totalProduced,
      rejectRate: totalProduced > 0 ? totalRejects / totalProduced : 0,
      downtimeCount: downtimes.length,
      entryCount: batches.length,
      activeActions: 0,
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}
