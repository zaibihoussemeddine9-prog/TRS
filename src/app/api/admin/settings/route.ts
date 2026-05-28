import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.stationSettings.findUnique({ where: { id: "settings" } });
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, address, phone, email, description, openingTime, closingTime, slotDuration, maxCarsPerSlot, workingDays, currency } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (address !== undefined) data.address = address;
  if (phone !== undefined) data.phone = phone;
  if (email !== undefined) data.email = email;
  if (description !== undefined) data.description = description;
  if (openingTime !== undefined) data.openingTime = openingTime;
  if (closingTime !== undefined) data.closingTime = closingTime;
  if (slotDuration !== undefined) data.slotDuration = Number(slotDuration);
  if (maxCarsPerSlot !== undefined) data.maxCarsPerSlot = Number(maxCarsPerSlot);
  if (workingDays !== undefined) data.workingDays = workingDays;
  if (currency !== undefined) data.currency = currency;

  const settings = await prisma.stationSettings.upsert({
    where: { id: "settings" },
    update: data,
    create: {
      id: "settings",
      name: name || "AutoSplash",
      ...data,
    },
  });
  return NextResponse.json({ settings });
}
