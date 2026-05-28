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
  const scooter = await prisma.scooter.findUnique({ where: { id } });
  if (!scooter) {
    return NextResponse.json({ error: "Scooter introuvable" }, { status: 404 });
  }

  return NextResponse.json(scooter);
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
  const { status, battery, lat, lng, address } = body;

  const scooter = await prisma.scooter.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(battery !== undefined && { battery }),
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
      ...(address !== undefined && { address }),
      lastPing: new Date(),
    },
  });

  return NextResponse.json(scooter);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.scooter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
