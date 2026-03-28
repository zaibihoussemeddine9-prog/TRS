import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { resolveUserId } from "@/lib/resolve-user";
import { recalcBatchTRS } from "@/lib/trs-recalc";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  try {
    const events = await prisma.downtimeEvent.findMany({
      where: batchId ? { batchId } : {},
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
    const { batchId, subCategoryId, startTime, description } = body;

    if (!batchId) {
      return NextResponse.json({ error: "Lot requis" }, { status: 400 });
    }

    const userId = await resolveUserId(body.userId);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non reconnu. Veuillez vous reconnecter." }, { status: 401 });
    }

    // startTime defaults to now
    const start = startTime ? new Date(startTime) : new Date();

    // Validate: not in the future (1 min tolerance)
    if (start.getTime() > Date.now() + 60000) {
      return NextResponse.json({ error: "L'heure de début ne peut pas être dans le futur." }, { status: 400 });
    }

    const event = await prisma.downtimeEvent.create({
      data: {
        batchId,
        subCategoryId: subCategoryId || null,
        startTime: start,
        endTime: null,
        duration: null,
        description: description || null,
        createdById: userId,
      },
      include: { subCategory: { include: { category: true } } },
    });

    // Recalc TRS for this batch (ongoing = 0 impact, but keeps consistency)
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

    // Resolve new start/end
    const newStart = startTime ? new Date(startTime) : existing.startTime;
    const newEnd = endTime ? new Date(endTime) : existing.endTime;

    // Validate: endTime > startTime
    if (newEnd && newStart && newEnd.getTime() <= newStart.getTime()) {
      return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début." }, { status: 400 });
    }

    // Calculate duration
    let duration = existing.duration;
    if (newEnd && newStart) {
      duration = (newEnd.getTime() - newStart.getTime()) / 60000;
      if (duration < 0) {
        return NextResponse.json({ error: "La durée ne peut pas être négative." }, { status: 400 });
      }
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

    // Recalc TRS for this batch
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

    // Recalc TRS for this batch
    await recalcBatchTRS(batchId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/downtimes]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
