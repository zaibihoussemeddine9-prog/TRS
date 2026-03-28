import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const types = await prisma.downtimeType.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(types);
  } catch (err) {
    console.error("[GET /api/causes]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}
