import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        line: true,
        product: true,
        shift: true,
        createdBy: { select: { name: true } },
        _count: { select: { downtimeEvents: true, productionDeclarations: true } },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (err) {
    console.error("[GET /api/production/[id]]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}
