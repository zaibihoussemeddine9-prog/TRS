import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, duration, price, category, active, color, icon, sortOrder } = body;

  if (!name || !duration || price == null) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: { name, description, duration: Number(duration), price: Number(price), category: category || "STANDARD", active: active !== false, color: color || "#0ea5e9", icon, sortOrder: Number(sortOrder) || 0 },
  });
  return NextResponse.json({ service }, { status: 201 });
}
