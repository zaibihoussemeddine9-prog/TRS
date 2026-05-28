"use client"
import { useState, useEffect } from "react"
import { ProductCard } from "@/components/shop/ProductCard"
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
  tiktokViews?: number | null
}

export function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState("tous")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/shop/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || [])
        setFiltered(data.products || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleCategory(cat: string) {
    setActiveCategory(cat)
    if (cat === "tous") {
      setFiltered(products)
    } else {
      setFiltered(products.filter((p) => p.category === cat))
    }
  }

  return (
    <section>
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "bg-[#ff2d55] text-white"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#161616] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-[#222]" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-[#222] rounded w-1/3" />
                <div className="h-4 bg-[#222] rounded" />
                <div className="h-8 bg-[#222] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🛍️</p>
          <p>Aucun produit dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
