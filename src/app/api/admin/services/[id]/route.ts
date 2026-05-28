import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, duration, price, category, active, color, icon, sortOrder } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (duration !== undefined) data.duration = Number(duration);
  if (price !== undefined) data.price = Number(price);
  if (category !== undefined) data.category = category;
  if (active !== undefined) data.active = active;
  if (color !== undefined) data.color = color;
  if (icon !== undefined) data.icon = icon;
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

  const service = await prisma.service.update({ where: { id }, data });
  return NextResponse.json({ service });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
