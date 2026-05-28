import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;

  const rentals = await prisma.rental.findMany({
    where: { userId },
    include: {
      scooter: {
        select: { name: true, code: true, model: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rentals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { scooterId, startLat, startLng } = body;

  if (!scooterId) {
    return NextResponse.json({ error: "scooterId requis" }, { status: 400 });
  }

  // Check if user already has an active rental
  const existingRental = await prisma.rental.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (existingRental) {
    return NextResponse.json(
      { error: "Vous avez déjà une course active" },
      { status: 409 }
    );
  }

  // Check scooter availability
  const scooter = await prisma.scooter.findUnique({ where: { id: scooterId } });
  if (!scooter) {
    return NextResponse.json({ error: "Scooter introuvable" }, { status: 404 });
  }
  if (scooter.status !== "AVAILABLE") {
    return NextResponse.json(
      { error: "Ce scooter n'est pas disponible" },
      { status: 409 }
    );
  }

  // Start rental and set scooter to RENTED atomically
  const [rental] = await prisma.$transaction([
    prisma.rental.create({
      data: {
        userId,
        scooterId,
        startLat: startLat ?? scooter.lat,
        startLng: startLng ?? scooter.lng,
        status: "ACTIVE",
      },
      include: {
        scooter: { select: { name: true, code: true, model: true } },
      },
    }),
    prisma.scooter.update({
      where: { id: scooterId },
      data: { status: "RENTED" },
    }),
  ]);

  return NextResponse.json(rental, { status: 201 });
}
