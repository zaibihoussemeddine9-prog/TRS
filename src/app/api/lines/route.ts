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
    const { name, code, workshopId, lineType, defaultSpeed, formatChangeTime, cleaningTime, targetOEE, active, userId } = body;

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

    const parsedSpeed = defaultSpeed ? parseFloat(String(defaultSpeed)) : null;
    const parsedFCT = formatChangeTime ? parseFloat(String(formatChangeTime)) : null;
    const parsedCT = cleaningTime ? parseFloat(String(cleaningTime)) : null;
    const parsedOEE = targetOEE ? parseFloat(String(targetOEE)) : null;

    if (parsedSpeed !== null && isNaN(parsedSpeed)) {
      return NextResponse.json({ error: "Cadence nominale invalide" }, { status: 400 });
    }
    if (parsedOEE !== null && (isNaN(parsedOEE) || parsedOEE < 0 || parsedOEE > 1)) {
      return NextResponse.json({ error: "TRS cible invalide (doit être entre 0 et 1)" }, { status: 400 });
    }

    // 1. Create the line — this is the critical operation
    const line = await prisma.packagingLine.create({
      data: {
        name,
        code,
        workshopId,
        lineType: lineType || null,
        defaultSpeed: parsedSpeed,
        formatChangeTime: parsedFCT,
        cleaningTime: parsedCT,
        targetOEE: parsedOEE,
        active: active !== false,
      },
      include: { workshop: { include: { site: true } } },
    });

    // 2. Audit log — non-blocking, never prevents success response
    createAuditLog({
      userId: userId || null,
      action: "CREATE",
      entity: "PackagingLine",
      entityId: line.id,
      newValue: { name, code, workshopId, lineType, defaultSpeed: parsedSpeed, formatChangeTime: parsedFCT, cleaningTime: parsedCT, targetOEE: parsedOEE },
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
    const { id, name, code, workshopId, lineType, defaultSpeed, formatChangeTime, cleaningTime, targetOEE, active, userId } = body;

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
        return NextResponse.json({ error: `Le code "${code}" est déjà utilisé par une autre ligne` }, { status: 409 });
      }
    }

    if (workshopId) {
      const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
      if (!workshop) {
        return NextResponse.json({ error: "Atelier introuvable" }, { status: 400 });
      }
    }

    const parsedSpeed = defaultSpeed !== undefined ? (defaultSpeed ? parseFloat(String(defaultSpeed)) : null) : undefined;
    const parsedFCT = formatChangeTime !== undefined ? (formatChangeTime ? parseFloat(String(formatChangeTime)) : null) : undefined;
    const parsedCT = cleaningTime !== undefined ? (cleaningTime ? parseFloat(String(cleaningTime)) : null) : undefined;
    const parsedOEE = targetOEE !== undefined ? (targetOEE ? parseFloat(String(targetOEE)) : null) : undefined;

    if (parsedSpeed !== undefined && parsedSpeed !== null && isNaN(parsedSpeed)) {
      return NextResponse.json({ error: "Cadence nominale invalide" }, { status: 400 });
    }
    if (parsedOEE !== undefined && parsedOEE !== null && (isNaN(parsedOEE) || parsedOEE < 0 || parsedOEE > 1)) {
      return NextResponse.json({ error: "TRS cible invalide (doit être entre 0 et 1)" }, { status: 400 });
    }

    // 1. Update the line — critical operation
    const line = await prisma.packagingLine.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(workshopId !== undefined && { workshopId }),
        ...(lineType !== undefined && { lineType: lineType || null }),
        ...(parsedSpeed !== undefined && { defaultSpeed: parsedSpeed }),
        ...(parsedFCT !== undefined && { formatChangeTime: parsedFCT }),
        ...(parsedCT !== undefined && { cleaningTime: parsedCT }),
        ...(parsedOEE !== undefined && { targetOEE: parsedOEE }),
        ...(active !== undefined && { active }),
      },
      include: { workshop: { include: { site: true } } },
    });

    // 2. Audit log — non-blocking
    createAuditLog({
      userId: userId || null,
      action: "UPDATE",
      entity: "PackagingLine",
      entityId: line.id,
      oldValue: existing as unknown as Record<string, unknown>,
      newValue: { name, code, workshopId, lineType, defaultSpeed: parsedSpeed, formatChangeTime: parsedFCT, cleaningTime: parsedCT, targetOEE: parsedOEE, active },
    });

    return NextResponse.json(line);
  } catch (err) {
    console.error("[PUT /api/lines] erreur:", err);
    const message = err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
