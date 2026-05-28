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

  const rental = await prisma.rental.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      scooter: {
        select: {
          id: true,
          name: true,
          code: true,
          model: true,
          pricePerMin: true,
          battery: true,
          lat: true,
          lng: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rental);
}
