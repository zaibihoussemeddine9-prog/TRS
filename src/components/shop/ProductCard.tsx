"use client"
import Link from "next/link"
import Image from "next/image"
import { Star, ShoppingCart, TrendingUp, Flame, Sparkles } from "lucide-react"
import { formatDZD, formatTiktokViews } from "@/lib/shop/utils"
import { useCartStore } from "@/lib/shop/cart-store"
import { useState } from "react"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number | null
  images: string[]
  category: string
  badge?: string | null
  rating: number
  reviewCount: number
  tiktokViews?: number | null
}

const BADGE_CONFIG = {
  VIRAL: { label: "🔥 VIRAL", className: "bg-red-500/90 text-white" },
  TRENDING: { label: "📈 TRENDING", className: "bg-orange-500/90 text-white" },
  NEW: { label: "✨ NEW", className: "bg-emerald-500/90 text-white" },
}

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)

  const badge = product.badge ? BADGE_CONFIG[product.badge as keyof typeof BADGE_CONFIG] : null
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link href={`/shop/${product.id}`} className="group block">
      <div className="bg-[#161616] rounded-2xl overflow-hidden border border-[#222] hover:border-[#ff2d55]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff2d55]/10">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.images[0] || "/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
          {badge && (
            <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          )}
          {discount && (
            <span className="absolute top-2 right-2 bg-[#ff2d55] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {product.tiktokViews && (
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#ff2d55]" />
              {formatTiktokViews(product.tiktokViews)}
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="text-xs text-gray-500 mb-1 capitalize">{product.category}</p>
          <h3 className="text-white text-sm font-medium leading-tight line-clamp-2 mb-2 group-hover:text-[#ff2d55] transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-semibold">{product.rating}</span>
            <span className="text-gray-600 text-xs">({product.reviewCount})</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">{formatDZD(product.price)}</p>
              {product.originalPrice && (
                <p className="text-gray-500 text-xs line-through">{formatDZD(product.originalPrice)}</p>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-[#ff2d55] hover:bg-[#e0254b] text-white"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {added ? "Ajouté!" : "Ajouter"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
