import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOrderNumber } from "@/lib/shop/utils"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (status && status !== "TOUTES") where.status = status

    const [orders, total] = await Promise.all([
      prisma.shopOrder.findMany({
        where,
        include: { items: { include: { product: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.shopOrder.count({ where }),
    ])

    const totalRevenue = await prisma.shopOrder.aggregate({
      _sum: { total: true },
      where: { status: { in: ["CONFIRMEE", "EN_LIVRAISON", "LIVREE"] } },
    })

    return NextResponse.json({
      orders,
      total,
      totalRevenue: totalRevenue._sum.total || 0,
    })
  } catch {
    return NextResponse.json({ orders: [], total: 0, totalRevenue: 0, error: "DB unavailable" }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, phone, wilayaId, wilayaName, commune, address, notes, items, subtotal, deliveryFee, total } = body

    if (!firstName || !lastName || !phone || !wilayaId || !commune || !address || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const orderNumber = generateOrderNumber()

    const order = await prisma.shopOrder.create({
      data: {
        orderNumber,
        firstName,
        lastName,
        phone,
        wilayaId: Number(wilayaId),
        wilayaName: wilayaName || "",
        commune,
        address,
        notes: notes || null,
        subtotal,
        deliveryFee,
        total,
        items: {
          create: items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    console.error("Order creation error:", err)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
