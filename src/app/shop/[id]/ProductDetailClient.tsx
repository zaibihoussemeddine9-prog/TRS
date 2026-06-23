"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ShoppingCart, ArrowLeft, Star, TrendingUp, Shield, Truck, RotateCcw } from "lucide-react"
import { useCartStore } from "@/lib/shop/cart-store"
import { formatDZD, formatTiktokViews } from "@/lib/shop/utils"

interface Product {
  id: string
  name: string
  nameAr: string
  description: string
  price: number
  originalPrice: number | null
  images: string[]
  category: string
  badge: string | null
  rating: number
  reviewCount: number
  tiktokViews: number | null
  stock: number
}

const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  VIRAL: { label: "🔥 VIRAL", className: "bg-red-500 text-white" },
  TRENDING: { label: "📈 TRENDING", className: "bg-orange-500 text-white" },
  NEW: { label: "✨ NOUVEAU", className: "bg-emerald-500 text-white" },
}

export function ProductDetailClient({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)

  const badge = product.badge ? BADGE_CONFIG[product.badge] : null
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  function handleAdd() {
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.images[0] || "", quantity: qty })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link href="/shop" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux produits
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#161616] border border-[#222] mb-3">
            <Image
              src={product.images[activeImg] || "/placeholder.png"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
            {badge && (
              <span className={`absolute top-4 left-4 text-sm font-bold px-3 py-1 rounded-full ${badge.className}`}>
                {badge.label}
              </span>
            )}
            {discount && (
              <span className="absolute top-4 right-4 bg-[#ff2d55] text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    activeImg === i ? "border-[#ff2d55]" : "border-[#222]"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-[#ff2d55] text-sm font-medium uppercase mb-2">{product.category}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{product.name}</h1>
          {product.nameAr && (
            <p className="text-gray-500 text-base mb-4 font-arabic" dir="rtl">{product.nameAr}</p>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
                />
              ))}
            </div>
            <span className="text-yellow-400 font-semibold text-sm">{product.rating}</span>
            <span className="text-gray-500 text-sm">({product.reviewCount} avis)</span>
            {product.tiktokViews && (
              <span className="flex items-center gap-1 text-xs text-gray-400 bg-[#1a1a1a] px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3 text-[#ff2d55]" />
                {formatTiktokViews(product.tiktokViews)}
              </span>
            )}
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-black text-white">{formatDZD(product.price)}</span>
            {product.originalPrice && (
              <span className="text-gray-500 text-xl line-through mb-0.5">{formatDZD(product.originalPrice)}</span>
            )}
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 text-white hover:bg-[#2a2a2a] transition-colors text-lg font-bold">−</button>
              <span className="w-10 text-center text-white font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-10 h-10 text-white hover:bg-[#2a2a2a] transition-colors text-lg font-bold">+</button>
            </div>
            <span className="text-gray-500 text-sm">{product.stock} en stock</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white transition-all ${
                added ? "bg-green-500" : "bg-[#ff2d55] hover:bg-[#e0254b] active:scale-95"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {added ? "✓ Ajouté au panier !" : "Ajouter au panier"}
            </button>
            <Link
              href="/shop/checkout"
              onClick={() => addItem({ productId: product.id, name: product.name, price: product.price, image: product.images[0] || "", quantity: qty })}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-[#ff2d55] border-2 border-[#ff2d55] hover:bg-[#ff2d55] hover:text-white transition-all"
            >
              Commander maintenant
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Truck, text: "Livraison 48-72h" },
              { icon: Shield, text: "Paiement à la livraison" },
              { icon: RotateCcw, text: "Retour facile" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 bg-[#161616] rounded-xl p-3 border border-[#222] text-center">
                <Icon className="w-5 h-5 text-[#ff2d55]" />
                <span className="text-gray-400 text-xs">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
