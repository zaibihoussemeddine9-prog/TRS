import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const shifts = await prisma.shift.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(shifts);
}
