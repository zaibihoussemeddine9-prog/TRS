import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcOEE } from "@/lib/trs-calculations";
import { productionEntrySchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lineId = searchParams.get("lineId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const shiftId = searchParams.get("shiftId");
  const productId = searchParams.get("productId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (lineId) where.lineId = lineId;
  if (shiftId) where.shiftId = shiftId;
  if (productId) where.productId = productId;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo);
  }

  const entries = await prisma.productionEntry.findMany({
    where,
    include: { line: true, shift: true, team: true, product: true, format: true, createdBy: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = productionEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const oeeResult = calcOEE({
    ...data,
    quantityRejected: data.quantityRejected ?? 0,
    plannedDowntime: data.plannedDowntime ?? 0,
    unplannedDowntime: data.unplannedDowntime ?? 0,
    formatChangeTime: data.formatChangeTime ?? 0,
    adjustmentTime: data.adjustmentTime ?? 0,
    cleaningTime: data.cleaningTime ?? 0,
    qualityWaitTime: data.qualityWaitTime ?? 0,
    maintenanceWaitTime: data.maintenanceWaitTime ?? 0,
    materialWaitTime: data.materialWaitTime ?? 0,
    microStopTime: data.microStopTime ?? 0,
  });

  const entry = await prisma.productionEntry.create({
    data: {
      date: new Date(data.date),
      lineId: data.lineId,
      shiftId: data.shiftId,
      teamId: data.teamId || null,
      productId: data.productId,
      formatId: data.formatId,
      lot: data.lot,
      orderNumber: data.orderNumber || null,
      plannedTime: data.plannedTime,
      plannedUsefulTime: data.plannedUsefulTime,
      actualRunningTime: data.actualRunningTime,
      plannedDowntime: data.plannedDowntime ?? 0,
      unplannedDowntime: data.unplannedDowntime ?? 0,
      formatChangeTime: data.formatChangeTime ?? 0,
      adjustmentTime: data.adjustmentTime ?? 0,
      cleaningTime: data.cleaningTime ?? 0,
      qualityWaitTime: data.qualityWaitTime ?? 0,
      maintenanceWaitTime: data.maintenanceWaitTime ?? 0,
      materialWaitTime: data.materialWaitTime ?? 0,
      microStopTime: data.microStopTime ?? 0,
      theoreticalSpeed: data.theoreticalSpeed,
      actualSpeed: data.actualSpeed,
      quantityProduced: data.quantityProduced,
      quantityConform: data.quantityConform,
      quantityRejected: data.quantityRejected ?? 0,
      availability: oeeResult.availability,
      performance: oeeResult.performance,
      quality: oeeResult.quality,
      oee: oeeResult.oee,
      comment: data.comment || null,
      status: data.status ?? "DRAFT",
      createdById: body.userId || "system",
    },
  });

  if (body.userId) {
    await createAuditLog({
      userId: body.userId,
      action: "CREATE",
      entity: "ProductionEntry",
      entityId: entry.id,
      newValue: data as Record<string, unknown>,
    });
  }

  return NextResponse.json(entry, { status: 201 });
}
