import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productionDeclarationSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { resolveUserId } from "@/lib/resolve-user";
import { calcShiftTRS, getShiftDurationMinutes } from "@/lib/trs-calculations";

const PAUSE_MINUTES = 30;

/** Compute TRS fields for a declaration */
async function computeTRS(batchId: string, shiftId: string, quantityProduced: number, microStopMinutes: number) {
  // Get shift duration
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) return {};

  const shiftDuration = getShiftDurationMinutes(shift.startTime, shift.endTime);

  // Get product nominal speed from batch
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { product: true },
  });
  const nominalSpeed = batch?.product?.nominalSpeed || 0;

  // Get total downtime for this batch (all DowntimeEvents)
  const downtimeAgg = await prisma.downtimeEvent.aggregate({
    where: { batchId },
    _sum: { duration: true },
  });
  const totalDowntime = downtimeAgg._sum.duration || 0;

  // For per-shift downtime, we'd need to filter by date — for now use proportional
  // Simple approach: distribute downtimes evenly if multiple shifts
  const declCount = await prisma.productionDeclaration.count({ where: { batchId } });
  const shiftDowntime = declCount > 0 ? totalDowntime / (declCount + 1) : totalDowntime;

  const trs = calcShiftTRS({
    shiftDurationMinutes: shiftDuration,
    pauseMinutes: PAUSE_MINUTES,
    downtimeMinutes: shiftDowntime,
    microStopMinutes,
    quantityProduced,
    nominalSpeed,
  });

  return {
    plannedMinutes: trs.plannedMinutes,
    runningMinutes: trs.runningMinutes,
    availability: Math.round(trs.availability * 10000) / 10000,
    performance: Math.round(trs.performance * 10000) / 10000,
    quality: Math.round(trs.quality * 10000) / 10000,
    oee: Math.round(trs.oee * 10000) / 10000,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  try {
    const entries = await prisma.productionDeclaration.findMany({
      where: batchId ? { batchId } : {},
      include: { shift: true, createdBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch (err) {
    console.error("[GET /api/production-declarations]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = productionDeclarationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const userId = await resolveUserId(body.userId);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non reconnu. Veuillez vous reconnecter." }, { status: 401 });
    }

    const trsFields = await computeTRS(d.batchId, d.shiftId, d.quantityProduced, d.microStopMinutes);

    const entry = await prisma.productionDeclaration.create({
      data: {
        batchId: d.batchId,
        shiftId: d.shiftId,
        date: new Date(d.date),
        quantityProduced: d.quantityProduced,
        actualSpeed: d.actualSpeed,
        microStopMinutes: d.microStopMinutes,
        comment: d.comment || null,
        createdById: userId,
        ...trsFields,
      },
      include: { shift: true },
    });

    createAuditLog({ userId, action: "CREATE", entity: "ProductionDeclaration", entityId: entry.id });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[POST /api/production-declarations]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, shiftId, date, quantityProduced, actualSpeed, microStopMinutes, comment } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const existing = await prisma.productionDeclaration.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Déclaration introuvable" }, { status: 404 });

    const userId = await resolveUserId(body.userId);

    const newShiftId = shiftId || existing.shiftId;
    const newQty = quantityProduced !== undefined ? Number(quantityProduced) : existing.quantityProduced;
    const newMicro = microStopMinutes !== undefined ? Number(microStopMinutes) : existing.microStopMinutes;

    const trsFields = await computeTRS(existing.batchId, newShiftId, newQty, newMicro);

    const entry = await prisma.productionDeclaration.update({
      where: { id },
      data: {
        ...(shiftId !== undefined && { shiftId }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(quantityProduced !== undefined && { quantityProduced: Number(quantityProduced) }),
        ...(actualSpeed !== undefined && { actualSpeed: Number(actualSpeed) }),
        ...(microStopMinutes !== undefined && { microStopMinutes: Number(microStopMinutes) }),
        ...(comment !== undefined && { comment: comment || null }),
        ...trsFields,
      },
      include: { shift: true },
    });

    createAuditLog({ userId, action: "UPDATE", entity: "ProductionDeclaration", entityId: entry.id });
    return NextResponse.json(entry);
  } catch (err) {
    console.error("[PUT /api/production-declarations]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await prisma.productionDeclaration.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/production-declarations]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
