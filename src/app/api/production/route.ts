import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { batchSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lineId = searchParams.get("lineId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (lineId) where.lineId = lineId;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo);
  }

  try {
    const batches = await prisma.batch.findMany({
      where,
      include: {
        line: true,
        product: true,
        createdBy: { select: { name: true } },
        _count: { select: { downtimeEvents: true, shiftProductions: true } },
      },
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

    const batch = await prisma.batch.create({
      data: {
        lot: d.lot,
        lineId: d.lineId,
        productId: d.productId,
        date: new Date(d.date),
        orderNumber: d.orderNumber || null,
        comment: d.comment || null,
        status: d.status || "OPEN",
        createdById: resolvedUserId,
      },
      include: { line: true, product: true },
    });

    createAuditLog({ userId: resolvedUserId, action: "CREATE", entity: "Batch", entityId: batch.id });
    return NextResponse.json(batch, { status: 201 });
  } catch (err) {
    console.error("[POST /api/production]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, lot, lineId, productId, date, orderNumber, comment, status, userId } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        ...(lot !== undefined && { lot }),
        ...(lineId !== undefined && { lineId }),
        ...(productId !== undefined && { productId }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(orderNumber !== undefined && { orderNumber: orderNumber || null }),
        ...(comment !== undefined && { comment: comment || null }),
        ...(status !== undefined && { status }),
      },
      include: { line: true, product: true },
    });

    createAuditLog({ userId, action: "UPDATE", entity: "Batch", entityId: batch.id });
    return NextResponse.json(batch);
  } catch (err) {
    console.error("[PUT /api/production]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await prisma.batch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/production]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
