import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const categories = await prisma.downtimeCategory.findMany({
      where: { active: true },
      include: {
        subCategories: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error("[GET /api/causes]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level, name, code, categoryId, color, sortOrder, userId } = body;

    if (!name || !code) return NextResponse.json({ error: "Nom et code requis" }, { status: 400 });

    if (level === "category") {
      const exists = await prisma.downtimeCategory.findUnique({ where: { code } });
      if (exists) return NextResponse.json({ error: `Code "${code}" déjà utilisé` }, { status: 409 });
      const cat = await prisma.downtimeCategory.create({
        data: { name, code, color: color || "#3b82f6", sortOrder: sortOrder || 0 },
      });
      createAuditLog({ userId, action: "CREATE", entity: "DowntimeCategory", entityId: cat.id });
      return NextResponse.json(cat, { status: 201 });
    }

    if (level === "subcategory") {
      if (!categoryId) return NextResponse.json({ error: "Catégorie requise" }, { status: 400 });
      const exists = await prisma.downtimeSubCategory.findUnique({ where: { code } });
      if (exists) return NextResponse.json({ error: `Code "${code}" déjà utilisé` }, { status: 409 });
      const sub = await prisma.downtimeSubCategory.create({
        data: { name, code, categoryId, sortOrder: sortOrder || 0 },
      });
      createAuditLog({ userId, action: "CREATE", entity: "DowntimeSubCategory", entityId: sub.id });
      return NextResponse.json(sub, { status: 201 });
    }

    return NextResponse.json({ error: "Niveau invalide (category/subcategory)" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/causes]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { level, id, name, code, color, sortOrder, active, userId } = body;
    if (!id || !level) return NextResponse.json({ error: "ID et niveau requis" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code;
    if (color !== undefined) data.color = color;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (active !== undefined) data.active = active;

    if (level === "category") {
      const item = await prisma.downtimeCategory.update({ where: { id }, data });
      return NextResponse.json(item);
    }
    if (level === "subcategory") {
      const item = await prisma.downtimeSubCategory.update({ where: { id }, data });
      return NextResponse.json(item);
    }

    return NextResponse.json({ error: "Niveau invalide" }, { status: 400 });
  } catch (err) {
    console.error("[PUT /api/causes]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
