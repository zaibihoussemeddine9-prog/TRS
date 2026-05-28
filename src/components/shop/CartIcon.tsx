"use client"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCartStore } from "@/lib/shop/cart-store"

export function CartIcon() {
  const totalItems = useCartStore((s) => s.totalItems)
  const count = totalItems()

  return (
    <Link href="/shop/cart" className="relative">
      <ShoppingBag className="w-6 h-6 text-white" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#ff2d55] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  )
}
