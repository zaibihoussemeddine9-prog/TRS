import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all");

  const lines = await prisma.packagingLine.findMany({
    where: all === "true" ? {} : { active: true },
    include: { workshop: { include: { site: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(lines);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, code, workshopId, lineType, defaultSpeed, formatChangeTime, cleaningTime, targetOEE, active, userId } = body;

  if (!name || !code || !workshopId) {
    return NextResponse.json({ error: "Nom, code et atelier requis" }, { status: 400 });
  }

  const existing = await prisma.packagingLine.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "Ce code ligne existe déjà" }, { status: 409 });
  }

  const line = await prisma.packagingLine.create({
    data: {
      name,
      code,
      workshopId,
      lineType: lineType || null,
      defaultSpeed: defaultSpeed ? parseFloat(defaultSpeed) : null,
      formatChangeTime: formatChangeTime ? parseFloat(formatChangeTime) : null,
      cleaningTime: cleaningTime ? parseFloat(cleaningTime) : null,
      targetOEE: targetOEE ? parseFloat(targetOEE) : null,
      active: active !== false,
    },
    include: { workshop: { include: { site: true } } },
  });

  if (userId) {
    await createAuditLog({
      userId,
      action: "CREATE",
      entity: "PackagingLine",
      entityId: line.id,
      newValue: { name, code, workshopId, lineType, defaultSpeed, formatChangeTime, cleaningTime, targetOEE },
    });
  }

  return NextResponse.json(line, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, code, workshopId, lineType, defaultSpeed, formatChangeTime, cleaningTime, targetOEE, active, userId } = body;

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const existing = await prisma.packagingLine.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Ligne introuvable" }, { status: 404 });
  }

  // Check code uniqueness if changed
  if (code && code !== existing.code) {
    const codeExists = await prisma.packagingLine.findUnique({ where: { code } });
    if (codeExists) {
      return NextResponse.json({ error: "Ce code ligne existe déjà" }, { status: 409 });
    }
  }

  const line = await prisma.packagingLine.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      ...(workshopId !== undefined && { workshopId }),
      ...(lineType !== undefined && { lineType: lineType || null }),
      ...(defaultSpeed !== undefined && { defaultSpeed: defaultSpeed ? parseFloat(defaultSpeed) : null }),
      ...(formatChangeTime !== undefined && { formatChangeTime: formatChangeTime ? parseFloat(formatChangeTime) : null }),
      ...(cleaningTime !== undefined && { cleaningTime: cleaningTime ? parseFloat(cleaningTime) : null }),
      ...(targetOEE !== undefined && { targetOEE: targetOEE ? parseFloat(targetOEE) : null }),
      ...(active !== undefined && { active }),
    },
    include: { workshop: { include: { site: true } } },
  });

  if (userId) {
    await createAuditLog({
      userId,
      action: "UPDATE",
      entity: "PackagingLine",
      entityId: line.id,
      oldValue: existing as unknown as Record<string, unknown>,
      newValue: { name, code, workshopId, lineType, defaultSpeed, formatChangeTime, cleaningTime, targetOEE, active },
    });
  }

  return NextResponse.json(line);
}
