import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const lines = await prisma.packagingLine.findMany({
    where: { active: true },
    include: { workshop: { include: { site: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(lines);
}
