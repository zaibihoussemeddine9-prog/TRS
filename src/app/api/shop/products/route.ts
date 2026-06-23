import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "50")
    const includeInactive = searchParams.get("includeInactive") === "true"

    const where: Record<string, unknown> = {}
    if (!includeInactive) where.active = true
    if (category && category !== "tous") where.category = category

    const [products, total] = await Promise.all([
      prisma.shopProduct.findMany({
        where,
        orderBy: [{ tiktokViews: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
      prisma.shopProduct.count({ where }),
    ])

    return NextResponse.json({ products, total })
  } catch (err) {
    return NextResponse.json({ products: [], total: 0, error: "DB unavailable" }, { status: 200 })
  }
}
