import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    const items = await prisma.referenceList.findMany({
      where: {
        ...(type && { type }),
        active: true,
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[GET /api/reference-lists]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, value, label } = await req.json();
    if (!type || !value || !label) return NextResponse.json({ error: "Type, valeur et libellé requis" }, { status: 400 });

    const exists = await prisma.referenceList.findUnique({ where: { type_value: { type, value } } });
    if (exists) return NextResponse.json({ error: `La valeur "${value}" existe déjà pour ce type` }, { status: 409 });

    const maxOrder = await prisma.referenceList.aggregate({ where: { type }, _max: { sortOrder: true } });
    const item = await prisma.referenceList.create({
      data: { type, value, label, sortOrder: (maxOrder._max.sortOrder || 0) + 1 },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reference-lists]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, value, label, sortOrder, active } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const item = await prisma.referenceList.update({
      where: { id },
      data: {
        ...(value !== undefined && { value }),
        ...(label !== undefined && { label }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      },
    });
    return NextResponse.json(item);
  } catch (err) {
    console.error("[PUT /api/reference-lists]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const item = await prisma.referenceList.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });

    // Check if used in products
    const field = item.type === "FAMILY" ? "family" : item.type === "FORM" ? "form" : "laboratory";
    const used = await prisma.product.count({ where: { [field]: item.value } });
    if (used > 0) {
      return NextResponse.json({ error: `Impossible de supprimer : utilisé par ${used} produit(s)` }, { status: 400 });
    }

    await prisma.referenceList.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/reference-lists]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
