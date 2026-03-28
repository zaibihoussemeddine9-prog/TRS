import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shiftProductionSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  try {
    const entries = await prisma.shiftProduction.findMany({
      where: batchId ? { batchId } : {},
      include: { createdBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch (err) {
    console.error("[GET /api/shift-production]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = shiftProductionSchema.safeParse(body);
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

    const entry = await prisma.shiftProduction.create({
      data: {
        batchId: d.batchId,
        shift: d.shift,
        date: new Date(d.date),
        quantityProduced: d.quantityProduced,
        quantityConform: d.quantityConform,
        quantityRejected: d.quantityRejected,
        createdById: resolvedUserId,
      },
    });

    createAuditLog({ userId: resolvedUserId, action: "CREATE", entity: "ShiftProduction", entityId: entry.id });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[POST /api/shift-production]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
