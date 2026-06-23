import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await prisma.shopOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await req.json()

    const VALID_STATUSES = ["NOUVELLE", "CONFIRMEE", "EN_LIVRAISON", "LIVREE", "ANNULEE"]
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const order = await prisma.shopOrder.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
