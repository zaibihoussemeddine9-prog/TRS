import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductDetailClient } from "./ProductDetailClient"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let product = null
  try {
    product = await prisma.shopProduct.findUnique({ where: { id } })
  } catch {
    // DB not available; return 404
  }

  if (!product) notFound()

  return <ProductDetailClient product={product} />
}
