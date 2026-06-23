import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, nameAr, image, sortOrder, active } = body;

  const cat = await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(nameAr !== undefined && { nameAr }),
      ...(image !== undefined && { image }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(active !== undefined && { active }),
    },
  });
  return NextResponse.json(cat);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  await prisma.category.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
