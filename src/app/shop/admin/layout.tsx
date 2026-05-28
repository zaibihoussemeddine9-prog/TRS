import Link from "next/link"
import { LayoutDashboard, Package, ShoppingBag, ArrowLeft } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <aside className="w-56 shrink-0 bg-[#111] border-r border-[#1e1e1e] p-4 hidden md:flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#ff2d55] to-[#ff6b35] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">TK</span>
          </div>
          <span className="text-white font-bold text-sm">Admin TikShopDZ</span>
        </div>
        <Link href="/shop" className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" />
          Boutique
        </Link>
        {[
          { href: "/shop/admin", icon: LayoutDashboard, label: "Tableau de bord" },
          { href: "/shop/admin/orders", icon: ShoppingBag, label: "Commandes" },
          { href: "/shop/admin/products", icon: Package, label: "Produits" },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] text-sm px-3 py-2.5 rounded-xl transition-all"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
