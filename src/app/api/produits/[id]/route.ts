import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, nameAr, description, descriptionAr, price, comparePrice, images, videoUrl, stock, categoryId, tags, featured, active } = body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(nameAr !== undefined && { nameAr }),
      ...(description !== undefined && { description }),
      ...(descriptionAr !== undefined && { descriptionAr }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(comparePrice !== undefined && { comparePrice: comparePrice ? parseFloat(comparePrice) : null }),
      ...(images !== undefined && { images }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(tags !== undefined && { tags }),
      ...(featured !== undefined && { featured }),
      ...(active !== undefined && { active }),
    },
    include: { category: true },
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
