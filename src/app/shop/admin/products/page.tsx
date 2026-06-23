"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Plus, RefreshCw, Edit, Trash2, X, Check } from "lucide-react"
import { formatDZD } from "@/lib/shop/utils"
import { CATEGORIES } from "@/data/products"

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
  stock: number
  active: boolean
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showSeed, setShowSeed] = useState(false)
  const [seeding, setSeeding] = useState(false)

  async function loadProducts() {
    setLoading(true)
    try {
      const res = await fetch("/api/shop/products?limit=100&includeInactive=true")
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  async function seedProducts() {
    setSeeding(true)
    try {
      await fetch("/api/shop/seed", { method: "POST" })
      await loadProducts()
      setShowSeed(false)
    } catch {
      alert("Erreur lors du chargement des produits de démonstration")
    } finally {
      setSeeding(false)
    }
  }

  async function toggleActive(product: Product) {
    try {
      await fetch(`/api/shop/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      })
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)))
    } catch {
      alert("Erreur lors de la mise à jour")
    }
  }

  const BADGE_COLORS: Record<string, string> = {
    VIRAL: "bg-red-500/20 text-red-400",
    TRENDING: "bg-orange-500/20 text-orange-400",
    NEW: "bg-emerald-500/20 text-emerald-400",
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Produits ({products.length})</h1>
        <div className="flex items-center gap-2">
          <button onClick={loadProducts} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {products.length === 0 && (
            <button
              onClick={seedProducts}
              disabled={seeding}
              className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {seeding ? "Chargement..." : "Importer produits démo"}
            </button>
          )}
        </div>
      </div>

      {products.length === 0 && !loading && (
        <div className="bg-[#161616] rounded-2xl border border-[#222] border-dashed p-12 text-center">
          <p className="text-gray-500 mb-4">Aucun produit. Importez les produits de démonstration pour commencer.</p>
          <button
            onClick={seedProducts}
            disabled={seeding}
            className="inline-flex items-center gap-2 bg-[#ff2d55] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e0254b] transition-colors disabled:opacity-50"
          >
            {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {seeding ? "Importation..." : "Importer 15 produits démo"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#161616] rounded-2xl p-4 border border-[#222] animate-pulse">
                <div className="aspect-video bg-[#222] rounded-xl mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-[#222] rounded w-3/4" />
                  <div className="h-3 bg-[#222] rounded w-1/2" />
                </div>
              </div>
            ))
          : products.map((product) => (
              <div key={product.id} className={`bg-[#161616] rounded-2xl border transition-all ${product.active ? "border-[#222]" : "border-[#333] opacity-60"}`}>
                <div className="relative aspect-video rounded-t-2xl overflow-hidden">
                  <Image
                    src={product.images[0] || "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    unoptimized
                  />
                  {product.badge && (
                    <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[product.badge] || ""}`}>
                      {product.badge}
                    </span>
                  )}
                  {!product.active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-red-500 px-3 py-1 rounded-full">INACTIF</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 capitalize mb-1">{product.category}</p>
                  <p className="text-white font-medium text-sm leading-tight line-clamp-2 mb-2">{product.name}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#ff2d55] font-bold">{formatDZD(product.price)}</span>
                    <span className="text-gray-500 text-xs">Stock: {product.stock}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-all ${
                        product.active
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                          : "bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white"
                      }`}
                    >
                      {product.active ? <><X className="w-3.5 h-3.5" />Désactiver</> : <><Check className="w-3.5 h-3.5" />Activer</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
