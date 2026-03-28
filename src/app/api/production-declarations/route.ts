import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productionDeclarationSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { resolveUserId } from "@/lib/resolve-user";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  try {
    const entries = await prisma.productionDeclaration.findMany({
      where: batchId ? { batchId } : {},
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
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
      return NextResponse.json({ error: "Aucun utilisateur trouvé. Veuillez vous reconnecter." }, { status: 401 });
    }

    const entry = await prisma.productionDeclaration.create({
      data: {
        batchId: d.batchId,
        quantityProduced: d.quantityProduced,
        quantityConform: d.quantityConform,
        quantityRejected: d.quantityRejected,
        comment: d.comment || null,
        createdById: userId,
      },
    });

    createAuditLog({ userId, action: "CREATE", entity: "ProductionDeclaration", entityId: entry.id });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[POST /api/production-declarations]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
