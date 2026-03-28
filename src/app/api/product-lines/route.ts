import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lineId = searchParams.get("lineId");
  const productId = searchParams.get("productId");

  const where: Record<string, unknown> = { active: true };
  if (lineId) where.lineId = lineId;
  if (productId) where.productId = productId;

  try {
    const links = await prisma.productLine.findMany({
      where,
      include: { product: true, line: true },
    });
    return NextResponse.json(links);
  } catch (err) {
    console.error("[GET /api/product-lines]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId, lineId } = await req.json();
    if (!productId || !lineId) return NextResponse.json({ error: "Produit et ligne requis" }, { status: 400 });

    const existing = await prisma.productLine.findUnique({
      where: { productId_lineId: { productId, lineId } },
    });
    if (existing) return NextResponse.json({ error: "Cette association existe déjà" }, { status: 409 });

    const link = await prisma.productLine.create({
      data: { productId, lineId },
      include: { product: true, line: true },
    });
    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    console.error("[POST /api/product-lines]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await prisma.productLine.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/product-lines]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
