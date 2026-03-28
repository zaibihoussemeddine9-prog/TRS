import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all");
  try {
    const products = await prisma.product.findMany({
      where: all === "true" ? {} : { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, family, form, laboratory, unitsPerPack, nominalSpeed, targetOEE, targetRejectRate, standardLotSize, formatChangeTime, cleaningTime, comments, active, userId } = body;
    if (!name || !code) return NextResponse.json({ error: "Nom et code requis" }, { status: 400 });
    const exists = await prisma.product.findUnique({ where: { code } });
    if (exists) return NextResponse.json({ error: `Code "${code}" déjà utilisé` }, { status: 409 });
    const product = await prisma.product.create({
      data: {
        name, code,
        family: family || null, form: form || null, laboratory: laboratory || null,
        unitsPerPack: unitsPerPack ? parseInt(String(unitsPerPack)) : null,
        nominalSpeed: nominalSpeed ? parseFloat(String(nominalSpeed)) : null,
        targetOEE: targetOEE ? parseFloat(String(targetOEE)) : null,
        targetRejectRate: targetRejectRate ? parseFloat(String(targetRejectRate)) : null,
        standardLotSize: standardLotSize ? parseFloat(String(standardLotSize)) : null,
        formatChangeTime: formatChangeTime ? parseFloat(String(formatChangeTime)) : null,
        cleaningTime: cleaningTime ? parseFloat(String(cleaningTime)) : null,
        comments: comments || null,
        active: active !== false,
      },
    });
    createAuditLog({ userId, action: "CREATE", entity: "Product", entityId: product.id, newValue: { name, code } });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[POST /api/products]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, code, name, family, form, laboratory, unitsPerPack, nominalSpeed, targetOEE, targetRejectRate, standardLotSize, formatChangeTime, cleaningTime, comments, active, userId } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    if (code && code !== existing.code) {
      const dup = await prisma.product.findUnique({ where: { code } });
      if (dup) return NextResponse.json({ error: `Code "${code}" déjà utilisé` }, { status: 409 });
    }
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(family !== undefined && { family: family || null }),
        ...(form !== undefined && { form: form || null }),
        ...(laboratory !== undefined && { laboratory: laboratory || null }),
        ...(unitsPerPack !== undefined && { unitsPerPack: unitsPerPack ? parseInt(String(unitsPerPack)) : null }),
        ...(nominalSpeed !== undefined && { nominalSpeed: nominalSpeed ? parseFloat(String(nominalSpeed)) : null }),
        ...(targetOEE !== undefined && { targetOEE: targetOEE ? parseFloat(String(targetOEE)) : null }),
        ...(targetRejectRate !== undefined && { targetRejectRate: targetRejectRate ? parseFloat(String(targetRejectRate)) : null }),
        ...(standardLotSize !== undefined && { standardLotSize: standardLotSize ? parseFloat(String(standardLotSize)) : null }),
        ...(formatChangeTime !== undefined && { formatChangeTime: formatChangeTime ? parseFloat(String(formatChangeTime)) : null }),
        ...(cleaningTime !== undefined && { cleaningTime: cleaningTime ? parseFloat(String(cleaningTime)) : null }),
        ...(comments !== undefined && { comments: comments || null }),
        ...(active !== undefined && { active }),
      },
    });
    createAuditLog({ userId, action: "UPDATE", entity: "Product", entityId: product.id });
    return NextResponse.json(product);
  } catch (err) {
    console.error("[PUT /api/products]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
