import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcOEE } from "@/lib/trs-calculations";
import { batchSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lineId = searchParams.get("lineId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

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
      include: { line: true, product: true, createdBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(batches);
  } catch (err) {
    console.error("[GET /api/production]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const userId = body.userId;

    // Resolve userId
    let resolvedUserId: string | null = null;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (user) resolvedUserId = user.id;
    }
    if (!resolvedUserId) {
      const fallback = await prisma.user.findFirst({ where: { role: "ADMIN", active: true }, select: { id: true } });
      if (!fallback) return NextResponse.json({ error: "Aucun utilisateur valide" }, { status: 400 });
      resolvedUserId = fallback.id;
    }

    const oee = calcOEE({
      plannedTime: d.plannedTime,
      actualRunningTime: d.actualRunningTime,
      theoreticalSpeed: d.theoreticalSpeed,
      quantityProduced: d.quantityProduced,
      quantityConform: d.quantityConform,
    });

    const batch = await prisma.batch.create({
      data: {
        lot: d.lot, lineId: d.lineId, productId: d.productId,
        date: new Date(d.date), shift: d.shift, orderNumber: d.orderNumber || null,
        plannedTime: d.plannedTime, actualRunningTime: d.actualRunningTime,
        theoreticalSpeed: d.theoreticalSpeed, actualSpeed: d.actualSpeed,
        quantityProduced: d.quantityProduced, quantityConform: d.quantityConform,
        quantityRejected: d.quantityRejected,
        availability: oee.availability, performance: oee.performance,
        quality: oee.quality, oee: oee.oee,
        comment: d.comment || null, status: d.status,
        createdById: resolvedUserId,
      },
    });

    createAuditLog({ userId: resolvedUserId, action: "CREATE", entity: "Batch", entityId: batch.id });
    return NextResponse.json(batch, { status: 201 });
  } catch (err) {
    console.error("[POST /api/production]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
