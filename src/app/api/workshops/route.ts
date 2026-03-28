import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workshops = await prisma.workshop.findMany({
    where: { active: true },
    include: { site: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(workshops);
}
