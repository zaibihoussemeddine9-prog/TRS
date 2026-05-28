import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: {
      scooter: { select: { name: true, code: true, model: true, pricePerMin: true } },
    },
  });

  if (!rental) {
    return NextResponse.json({ error: "Course introuvable" }, { status: 404 });
  }

  // Only owner or admin can view
  if (rental.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json(rental);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { endLat, endLng } = body;

  const rental = await prisma.rental.findUnique({
    where: { id },
    include: { scooter: true },
  });

  if (!rental) {
    return NextResponse.json({ error: "Course introuvable" }, { status: 404 });
  }

  if (rental.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (rental.status !== "ACTIVE") {
    return NextResponse.json({ error: "Cette course est déjà terminée" }, { status: 409 });
  }

  const endTime = new Date();
  const durationMs = endTime.getTime() - rental.startTime.getTime();
  const durationMin = durationMs / 1000 / 60;
  const totalCost = Math.round(durationMin * rental.scooter.pricePerMin * 100) / 100;

  const [updatedRental] = await prisma.$transaction([
    prisma.rental.update({
      where: { id },
      data: {
        endTime,
        endLat: endLat ?? rental.scooter.lat,
        endLng: endLng ?? rental.scooter.lng,
        durationMin,
        totalCost,
        status: "COMPLETED",
        paymentStatus: "PAID",
      },
      include: {
        scooter: { select: { name: true, code: true, model: true, pricePerMin: true } },
      },
    }),
    prisma.scooter.update({
      where: { id: rental.scooterId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  return NextResponse.json(updatedRental);
}
