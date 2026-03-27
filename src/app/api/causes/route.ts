import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const causes = await prisma.downtimeCause.findMany({
    where: { active: true },
    include: { subCauses: { where: { active: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(causes);
}
