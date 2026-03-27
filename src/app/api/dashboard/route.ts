import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcAggregateOEE, ProductionData } from "@/lib/trs-calculations";

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

  const entries = await prisma.productionEntry.findMany({
    where,
    include: { line: true, shift: true, product: true },
  });

  const globalOEE = calcAggregateOEE(entries as unknown as ProductionData[]);

  // Per-line KPIs
  const lines = await prisma.packagingLine.findMany({ where: { active: true } });
  const lineKPIs = lines.map((line) => {
    const lineEntries = entries.filter((e) => e.lineId === line.id);
    const oee = calcAggregateOEE(lineEntries as unknown as ProductionData[]);
    return { lineId: line.id, lineName: line.name, lineCode: line.code, ...oee, entryCount: lineEntries.length };
  });

  // Daily trend
  const dailyMap = new Map<string, typeof entries>();
  entries.forEach((e) => {
    const key = new Date(e.date).toISOString().split("T")[0];
    if (!dailyMap.has(key)) dailyMap.set(key, []);
    dailyMap.get(key)!.push(e);
  });

  const dailyTrend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEntries]) => ({
      date,
      ...calcAggregateOEE(dayEntries as unknown as ProductionData[]),
    }));

  // Downtime summary
  const downtimes = await prisma.downtimeEntry.findMany({
    where: lineId ? { lineId } : {},
    include: { cause: true },
  });

  const causeMap = new Map<string, { name: string; total: number; count: number }>();
  downtimes.forEach((d) => {
    const key = d.causeId;
    const existing = causeMap.get(key) || { name: d.cause.name, total: 0, count: 0 };
    existing.total += d.duration || 0;
    existing.count += 1;
    causeMap.set(key, existing);
  });

  const downtimeByCause = Array.from(causeMap.values()).sort((a, b) => b.total - a.total);

  // Totals
  const totalDowntime = downtimes.reduce((sum, d) => sum + (d.duration || 0), 0);
  const totalRejects = entries.reduce((sum, e) => sum + e.quantityRejected, 0);
  const totalProduced = entries.reduce((sum, e) => sum + e.quantityProduced, 0);

  // Active action plans
  const activeActions = await prisma.actionPlan.count({
    where: { status: { in: ["TODO", "IN_PROGRESS"] } },
  });

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
    entryCount: entries.length,
    activeActions,
  });
}
