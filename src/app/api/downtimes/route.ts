import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { resolveUserId } from "@/lib/resolve-user";
import { recalcBatchTRS } from "@/lib/trs-recalc";

/**
 * Check if two time intervals overlap.
 * [s1, e1) and [s2, e2) overlap if s1 < e2 AND s2 < e1.
 * For ongoing downtimes (no endTime), they overlap with any interval after their start.
 */
function intervalsOverlap(
  s1: Date, e1: Date | null,
  s2: Date, e2: Date | null
): boolean {
  const s1t = s1.getTime();
  const s2t = s2.getTime();
  const e1t = e1 ? e1.getTime() : Infinity;
  const e2t = e2 ? e2.getTime() : Infinity;
  return s1t < e2t && s2t < e1t;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");
  const lineId = searchParams.get("lineId");
  const dateFrom = searchParams.get("dateFrom");

  try {
    const where: Record<string, unknown> = {};
    if (batchId) where.batchId = batchId;
    if (lineId) where.batch = { lineId };
    if (dateFrom) where.startTime = { gte: new Date(dateFrom) };

    const events = await prisma.downtimeEvent.findMany({
      where,
      include: {
        batch: { include: { line: true } },
        subCategory: { include: { category: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { startTime: "desc" },
    });
    return NextResponse.json(events);
  } catch (err) {
    console.error("[GET /api/downtimes]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, subCategoryId, startTime, endTime, description } = body;

    if (!batchId) {
      return NextResponse.json({ error: "Lot requis" }, { status: 400 });
    }

    const userId = await resolveUserId(body.userId);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non reconnu. Veuillez vous reconnecter." }, { status: 401 });
    }

    // Load batch for time window validation
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });

    const start = startTime ? new Date(startTime) : new Date();
    const end = endTime ? new Date(endTime) : null;

    // Validate: not in the future (1 min tolerance)
    if (start.getTime() > Date.now() + 60000) {
      return NextResponse.json({ error: "L'heure de début ne peut pas être dans le futur." }, { status: 400 });
    }

    // Validate: endTime > startTime
    if (end && end.getTime() <= start.getTime()) {
      return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début." }, { status: 400 });
    }

    // Validate: within batch time window
    if (start.getTime() < batch.startTime.getTime()) {
      return NextResponse.json({ error: "L'arrêt ne peut pas commencer avant le début du lot." }, { status: 400 });
    }
    if (batch.endTime) {
      const effectiveEnd = end || start; // If ongoing, check start is before batch end
      if (effectiveEnd.getTime() > batch.endTime.getTime()) {
        return NextResponse.json({ error: "L'arrêt dépasse la fin du lot." }, { status: 400 });
      }
    }

    // Validate: no overlap with existing downtimes
    const existing = await prisma.downtimeEvent.findMany({
      where: { batchId },
      select: { id: true, startTime: true, endTime: true },
    });
    for (const ex of existing) {
      if (intervalsOverlap(start, end, ex.startTime, ex.endTime)) {
        return NextResponse.json({ error: "Un arrêt existe déjà sur cette plage horaire." }, { status: 400 });
      }
    }

    const duration = end ? (end.getTime() - start.getTime()) / 60000 : null;

    const event = await prisma.downtimeEvent.create({
      data: {
        batchId,
        subCategoryId: subCategoryId || null,
        startTime: start,
        endTime: end,
        duration,
        description: description || null,
        createdById: userId,
      },
      include: { subCategory: { include: { category: true } } },
    });

    recalcBatchTRS(batchId);

    createAuditLog({ userId, action: "CREATE", entity: "DowntimeEvent", entityId: event.id });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("[POST /api/downtimes]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, endTime, startTime, subCategoryId, description } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const existing = await prisma.downtimeEvent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Arrêt introuvable" }, { status: 404 });

    const userId = await resolveUserId(body.userId);

    const newStart = startTime ? new Date(startTime) : existing.startTime;
    const newEnd = endTime ? new Date(endTime) : existing.endTime;

    // Validate: endTime > startTime
    if (newEnd && newStart && newEnd.getTime() <= newStart.getTime()) {
      return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début." }, { status: 400 });
    }

    // Load batch for time window validation
    const batch = await prisma.batch.findUnique({ where: { id: existing.batchId } });
    if (batch) {
      if (newStart.getTime() < batch.startTime.getTime()) {
        return NextResponse.json({ error: "L'arrêt ne peut pas commencer avant le début du lot." }, { status: 400 });
      }
      if (batch.endTime && newEnd && newEnd.getTime() > batch.endTime.getTime()) {
        return NextResponse.json({ error: "L'arrêt dépasse la fin du lot." }, { status: 400 });
      }
    }

    // Validate: no overlap with other downtimes (exclude current)
    const others = await prisma.downtimeEvent.findMany({
      where: { batchId: existing.batchId, NOT: { id } },
      select: { id: true, startTime: true, endTime: true },
    });
    for (const ex of others) {
      if (intervalsOverlap(newStart, newEnd, ex.startTime, ex.endTime)) {
        return NextResponse.json({ error: "Un autre arrêt existe déjà sur cette plage horaire." }, { status: 400 });
      }
    }

    // Calculate duration
    let duration = existing.duration;
    if (newEnd && newStart) {
      duration = (newEnd.getTime() - newStart.getTime()) / 60000;
    }

    const event = await prisma.downtimeEvent.update({
      where: { id },
      data: {
        ...(startTime !== undefined && { startTime: newStart }),
        ...(endTime !== undefined && { endTime: newEnd }),
        ...(duration !== undefined && { duration }),
        ...(subCategoryId !== undefined && { subCategoryId: subCategoryId || null }),
        ...(description !== undefined && { description: description || null }),
      },
      include: { subCategory: { include: { category: true } } },
    });

    await recalcBatchTRS(existing.batchId);

    createAuditLog({ userId, action: "UPDATE", entity: "DowntimeEvent", entityId: event.id });
    return NextResponse.json(event);
  } catch (err) {
    console.error("[PUT /api/downtimes]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const existing = await prisma.downtimeEvent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Arrêt introuvable" }, { status: 404 });

    const batchId = existing.batchId;
    await prisma.downtimeEvent.delete({ where: { id } });
    await recalcBatchTRS(batchId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/downtimes]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
