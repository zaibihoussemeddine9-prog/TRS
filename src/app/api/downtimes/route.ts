import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downtimeEventSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { resolveUserId } from "@/lib/resolve-user";

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
    const parsed = downtimeEventSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const userId = await resolveUserId(body.userId);
    if (!userId) {
      return NextResponse.json({ error: "Aucun utilisateur trouvé. Veuillez vous reconnecter." }, { status: 401 });
    }

    const startTime = new Date(d.startTime);
    const endTime = d.endTime ? new Date(d.endTime) : null;
    const duration = d.duration ?? (endTime ? (endTime.getTime() - startTime.getTime()) / 60000 : null);

    const event = await prisma.downtimeEvent.create({
      data: {
        batchId: d.batchId,
        subCategoryId: d.subCategoryId,
        startTime,
        endTime,
        duration,
        description: d.description || null,
        createdById: userId,
      },
      include: { subCategory: { include: { category: true } } },
    });

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
    const { id, endTime, duration, description, subCategoryId } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const existing = await prisma.downtimeEvent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Arrêt introuvable" }, { status: 404 });

    const computedEnd = endTime ? new Date(endTime) : null;
    const computedDuration = duration ?? (computedEnd ? (computedEnd.getTime() - existing.startTime.getTime()) / 60000 : existing.duration);

    const userId = await resolveUserId(body.userId);

    const event = await prisma.downtimeEvent.update({
      where: { id },
      data: {
        ...(computedEnd && { endTime: computedEnd }),
        ...(computedDuration !== undefined && { duration: computedDuration }),
        ...(description !== undefined && { description: description || null }),
        ...(subCategoryId !== undefined && { subCategoryId }),
      },
    });

    createAuditLog({ userId, action: "UPDATE", entity: "DowntimeEvent", entityId: event.id });
    return NextResponse.json(event);
  } catch (err) {
    console.error("[PUT /api/downtimes]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
