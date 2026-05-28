import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { lat, lng, speed, battery } = body;

  if (lat === undefined || lng === undefined) {
    return NextResponse.json({ error: "lat et lng requis" }, { status: 400 });
  }

  const gpsPoint = await prisma.gpsPoint.create({
    data: {
      scooterId: id,
      lat,
      lng,
      speed: speed ?? null,
      battery: battery ?? null,
    },
  });

  // Also update scooter position
  await prisma.scooter.update({
    where: { id },
    data: {
      lat,
      lng,
      ...(battery !== undefined && { battery }),
      lastPing: new Date(),
    },
  });

  return NextResponse.json(gpsPoint, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const points = await prisma.gpsPoint.findMany({
    where: { scooterId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(points);
}
