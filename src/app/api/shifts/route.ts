import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(shifts);
  } catch (err) {
    console.error("[GET /api/shifts]", err);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}
