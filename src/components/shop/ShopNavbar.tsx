"use client"
import Link from "next/link"
import { Search, User, LayoutDashboard } from "lucide-react"
import { CartIcon } from "./CartIcon"

export function ShopNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1e1e1e]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/shop" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-[#ff2d55] to-[#ff6b35] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">TK</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            TikShop<span className="text-[#ff2d55]">DZ</span>
          </span>
        </Link>

        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2d55] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/shop/admin" className="hidden md:flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Admin
          </Link>
          <CartIcon />
          <button className="text-gray-400 hover:text-white transition-colors">
            <User className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  )
}
