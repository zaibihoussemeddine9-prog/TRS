import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { batchSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { resolveUserId } from "@/lib/resolve-user";
import { recalcBatchTRS } from "@/lib/trs-recalc";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const lineId = searchParams.get("lineId");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // Single batch by ID
  if (id) {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
          line: true, product: true,
          createdBy: { select: { name: true } },
          _count: { select: { downtimeEvents: true, productionDeclarations: true } },
        },
      });
      if (!batch) return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
      return NextResponse.json(batch);
    } catch (err) {
      console.error("[GET /api/production?id]", err);
      return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
    }
  }

  const where: Record<string, unknown> = {};
  if (lineId) where.lineId = lineId;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.startTime = {};
    if (dateFrom) (where.startTime as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      (where.startTime as Record<string, unknown>).lte = endOfDay;
    }
  }

  try {
    const batches = await prisma.batch.findMany({
      where,
      include: {
        line: true,
        product: true,
        createdBy: { select: { name: true } },
        _count: { select: { downtimeEvents: true, productionDeclarations: true } },
      },
      orderBy: { startTime: "desc" },
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

    const userId = await resolveUserId(body.userId);
    if (!userId) {
      return NextResponse.json({ error: "Aucun utilisateur trouvé. Veuillez vous reconnecter ou contacter l'administrateur." }, { status: 401 });
    }

    // Verify product-line compatibility (skip check if no ProductLine configured for this line)
    const lineHasConfig = await prisma.productLine.count({ where: { lineId: d.lineId } });
    if (lineHasConfig > 0) {
      const compat = await prisma.productLine.findUnique({
        where: { productId_lineId: { productId: d.productId, lineId: d.lineId } },
      });
      if (!compat) {
        return NextResponse.json({ error: "Ce produit n'est pas autorisé sur cette ligne." }, { status: 400 });
      }
    }

    const batch = await prisma.batch.create({
      data: {
        lot: d.lot,
        lineId: d.lineId,
        productId: d.productId,
        startTime: new Date(d.startTime),
        endTime: d.endTime ? new Date(d.endTime) : null,
        orderNumber: d.orderNumber || null,
        comment: d.comment || null,
        status: d.status || "OPEN",
        createdById: userId,
      },
      include: { line: true, product: true },
    });

    createAuditLog({ userId, action: "CREATE", entity: "Batch", entityId: batch.id });
    return NextResponse.json(batch, { status: 201 });
  } catch (err) {
    console.error("[POST /api/production]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, lot, lineId, productId, startTime, endTime, orderNumber, comment, status } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const userId = await resolveUserId(body.userId);

    // Validate endTime > startTime if both provided
    if (startTime && endTime) {
      const st = new Date(startTime);
      const et = new Date(endTime);
      if (et <= st) {
        return NextResponse.json({ error: "La date de fin doit être après la date de début." }, { status: 400 });
      }
    }

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        ...(lot !== undefined && { lot }),
        ...(lineId !== undefined && { lineId }),
        ...(productId !== undefined && { productId }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
        ...(orderNumber !== undefined && { orderNumber: orderNumber || null }),
        ...(comment !== undefined && { comment: comment || null }),
        ...(status !== undefined && { status }),
      },
      include: { line: true, product: true },
    });

    // Calculate reject/yield when closing the lot
    if (status === "CLOSED") {
      const agg = await prisma.productionDeclaration.aggregate({
        where: { batchId: id },
        _sum: { quantityProduced: true },
      });
      const totalProduced = agg._sum.quantityProduced || 0;
      const standardLotSize = batch.product?.standardLotSize || 0;
      const quantityRejected = Math.max(standardLotSize - totalProduced, 0);
      const yieldRate = standardLotSize > 0 ? totalProduced / standardLotSize : 1.0;

      await prisma.batch.update({
        where: { id },
        data: { quantityRejected, yieldRate },
      });

      // Recalculate TRS with quality = yieldRate
      await recalcBatchTRS(id);
    }

    createAuditLog({ userId, action: "UPDATE", entity: "Batch", entityId: batch.id });

    // Return fresh batch data
    const updated = await prisma.batch.findUnique({
      where: { id },
      include: { line: true, product: true },
    });
    return NextResponse.json(updated);
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
