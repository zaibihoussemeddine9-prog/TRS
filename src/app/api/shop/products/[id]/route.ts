import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.shopProduct.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const product = await prisma.shopProduct.update({ where: { id }, data })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
