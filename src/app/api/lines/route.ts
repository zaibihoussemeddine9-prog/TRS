import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all");

  try {
    const lines = await prisma.packagingLine.findMany({
      where: all === "true" ? {} : { active: true },
      include: { workshop: { include: { site: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(lines);
  } catch (err) {
    console.error("[GET /api/lines]", err);
    return NextResponse.json({ error: "Erreur lors du chargement des lignes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, workshopId, lineType, active, userId } = body;

    if (!name || !code || !workshopId) {
      return NextResponse.json({ error: "Nom, code et atelier sont obligatoires" }, { status: 400 });
    }

    const existing = await prisma.packagingLine.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: `Le code "${code}" existe déjà` }, { status: 409 });
    }

    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) {
      return NextResponse.json({ error: "Atelier introuvable" }, { status: 400 });
    }

    const line = await prisma.packagingLine.create({
      data: {
        name, code, workshopId,
        lineType: lineType || null,
        active: active !== false,
      },
      include: { workshop: { include: { site: true } } },
    });

    createAuditLog({
      userId: userId || null,
      action: "CREATE",
      entity: "PackagingLine",
      entityId: line.id,
      newValue: { name, code, workshopId, lineType },
    });

    return NextResponse.json(line, { status: 201 });
  } catch (err) {
    console.error("[POST /api/lines] erreur:", err);
    const message = err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, code, workshopId, lineType, active, userId } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const existing = await prisma.packagingLine.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Ligne introuvable" }, { status: 404 });
    }

    if (code && code !== existing.code) {
      const codeExists = await prisma.packagingLine.findUnique({ where: { code } });
      if (codeExists) {
        return NextResponse.json({ error: `Le code "${code}" est déjà utilisé` }, { status: 409 });
      }
    }

    const line = await prisma.packagingLine.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(workshopId !== undefined && { workshopId }),
        ...(lineType !== undefined && { lineType: lineType || null }),
        ...(active !== undefined && { active }),
      },
      include: { workshop: { include: { site: true } } },
    });

    createAuditLog({
      userId: userId || null,
      action: "UPDATE",
      entity: "PackagingLine",
      entityId: line.id,
      oldValue: existing as unknown as Record<string, unknown>,
      newValue: { name, code, workshopId, lineType, active },
    });

    return NextResponse.json(line);
  } catch (err) {
    console.error("[PUT /api/lines] erreur:", err);
    const message = err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
