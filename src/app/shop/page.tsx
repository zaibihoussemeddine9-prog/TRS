import { Suspense } from "react"
import { ProductsGrid } from "./ProductsGrid"
import { TrendingBanner } from "./TrendingBanner"

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <TrendingBanner />
      <Suspense fallback={<ProductsGridSkeleton />}>
        <ProductsGrid />
      </Suspense>
    </div>
  )
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-[#161616] rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-square bg-[#222]" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-[#222] rounded w-1/3" />
            <div className="h-4 bg-[#222] rounded w-full" />
            <div className="h-3 bg-[#222] rounded w-2/3" />
            <div className="h-8 bg-[#222] rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
