import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all");
  try {
    const lines = await prisma.line.findMany({
      where: all === "true" ? {} : { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(lines);
  } catch (err) {
    console.error("[GET /api/lines]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, code, lineType, active, userId } = await req.json();
    if (!name || !code) return NextResponse.json({ error: "Nom et code requis" }, { status: 400 });
    const exists = await prisma.line.findUnique({ where: { code } });
    if (exists) return NextResponse.json({ error: `Code "${code}" déjà utilisé` }, { status: 409 });
    const line = await prisma.line.create({ data: { name, code, lineType: lineType || null, active: active !== false } });
    createAuditLog({ userId, action: "CREATE", entity: "Line", entityId: line.id, newValue: { name, code } });
    return NextResponse.json(line, { status: 201 });
  } catch (err) {
    console.error("[POST /api/lines]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, code, lineType, active, userId } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const existing = await prisma.line.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ligne introuvable" }, { status: 404 });
    if (code && code !== existing.code) {
      const dup = await prisma.line.findUnique({ where: { code } });
      if (dup) return NextResponse.json({ error: `Code "${code}" déjà utilisé` }, { status: 409 });
    }
    const line = await prisma.line.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(lineType !== undefined && { lineType: lineType || null }),
        ...(active !== undefined && { active }),
      },
    });
    createAuditLog({ userId, action: "UPDATE", entity: "Line", entityId: line.id });
    return NextResponse.json(line);
  } catch (err) {
    console.error("[PUT /api/lines]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
