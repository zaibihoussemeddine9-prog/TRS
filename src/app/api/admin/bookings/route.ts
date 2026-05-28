import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (date) {
    const d = new Date(date);
    const d2 = new Date(date);
    d2.setDate(d2.getDate() + 1);
    where.date = { gte: d, lt: d2 };
  }
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
      { reference: { contains: search, mode: "insensitive" } },
      { carPlate: { contains: search, mode: "insensitive" } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
    include: { service: true },
  });

  return NextResponse.json({ bookings });
}
