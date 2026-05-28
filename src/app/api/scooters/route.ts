import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const scooters = await prisma.scooter.findMany({
    where: status ? { status } : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(scooters);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { name, code, model, lat, lng, pricePerMin, maxSpeed, battery } = body;

  if (!name || !code) {
    return NextResponse.json({ error: "Nom et code requis" }, { status: 400 });
  }

  const scooter = await prisma.scooter.create({
    data: {
      name,
      code,
      model: model ?? "Xiaomi Pro 2",
      lat: lat ?? 36.7538,
      lng: lng ?? 3.0588,
      pricePerMin: pricePerMin ?? 2.5,
      maxSpeed: maxSpeed ?? 25,
      battery: battery ?? 100,
      status: "AVAILABLE",
    },
  });

  return NextResponse.json(scooter, { status: 201 });
}
