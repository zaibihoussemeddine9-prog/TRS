import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productionDeclarationSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = productionDeclarationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const sessionUserId = session?.user?.id || body.userId;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Utilisateur non reconnu. Veuillez vous reconnecter." }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { id: sessionUserId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non reconnu. Veuillez vous reconnecter." }, { status: 401 });
    }

    const entry = await prisma.productionDeclaration.create({
      data: {
        batchId: d.batchId,
        quantityProduced: d.quantityProduced,
        quantityConform: d.quantityConform,
        quantityRejected: d.quantityRejected,
        comment: d.comment || null,
        createdById: user.id,
      },
    });

    createAuditLog({ userId: user.id, action: "CREATE", entity: "ProductionDeclaration", entityId: entry.id });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[POST /api/production-declarations]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
