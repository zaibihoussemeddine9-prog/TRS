import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEMO_PRODUCTS } from "@/data/products"

export async function POST() {
  try {
    const existing = await prisma.shopProduct.count()
    if (existing > 0) {
      return NextResponse.json({ message: "Products already seeded", count: existing })
    }

    const products = await prisma.shopProduct.createMany({
      data: DEMO_PRODUCTS.map((p) => ({
        name: p.name,
        nameAr: p.nameAr,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        images: p.images,
        category: p.category,
        badge: p.badge ?? null,
        rating: p.rating,
        reviewCount: p.reviewCount,
        stock: p.stock,
        tiktokViews: p.tiktokViews ?? null,
        active: true,
      })),
    })

    return NextResponse.json({ message: "Seeded successfully", count: products.count })
  } catch (err) {
    console.error("Seed error:", err)
    return NextResponse.json({ error: "Seed failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to seed products" })
}
