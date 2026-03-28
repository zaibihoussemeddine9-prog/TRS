import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downtimeSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = {};
  if (batchId) where.batchId = batchId;
  if (dateFrom || dateTo) {
    where.batch = { date: {} };
    if (dateFrom) ((where.batch as Record<string, unknown>).date as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) ((where.batch as Record<string, unknown>).date as Record<string, unknown>).lte = new Date(dateTo);
  }

  try {
    const downtimes = await prisma.downtime.findMany({
      where,
      include: { batch: { include: { line: true } }, downtimeType: true },
      orderBy: { startTime: "desc" },
    });
    return NextResponse.json(downtimes);
  } catch (err) {
    console.error("[GET /api/downtimes]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = downtimeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const userId = body.userId;

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

    const startTime = new Date(d.startTime);
    const endTime = d.endTime ? new Date(d.endTime) : null;
    const duration = d.duration ?? (endTime ? (endTime.getTime() - startTime.getTime()) / 60000 : null);

    const downtime = await prisma.downtime.create({
      data: {
        batchId: d.batchId, downtimeTypeId: d.downtimeTypeId,
        startTime, endTime, duration,
        description: d.description || null,
        createdById: resolvedUserId,
      },
    });

    createAuditLog({ userId: resolvedUserId, action: "CREATE", entity: "Downtime", entityId: downtime.id });
    return NextResponse.json(downtime, { status: 201 });
  } catch (err) {
    console.error("[POST /api/downtimes]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
