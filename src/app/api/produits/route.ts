import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("categorie");
  const q = searchParams.get("q");
  const featured = searchParams.get("featured") === "true";

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(featured && { featured: true }),
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { category: true },
    orderBy: { sold: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { name, nameAr, description, descriptionAr, price, comparePrice, images, videoUrl, stock, categoryId, tags, featured, active } = body;

  if (!name || !price) {
    return NextResponse.json({ error: "Nom et prix obligatoires" }, { status: 400 });
  }

  let slug = slugify(name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const product = await prisma.product.create({
    data: {
      name,
      nameAr: nameAr || null,
      slug,
      description: description || null,
      descriptionAr: descriptionAr || null,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      images: images || [],
      videoUrl: videoUrl || null,
      stock: parseInt(stock) || 0,
      categoryId: categoryId || null,
      tags: tags || [],
      featured: featured || false,
      active: active !== false,
    },
    include: { category: true },
  });

  return NextResponse.json(product, { status: 201 });
}
