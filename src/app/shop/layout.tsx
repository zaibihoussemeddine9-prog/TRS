import type { Metadata } from "next"
import { ShopNavbar } from "@/components/shop/ShopNavbar"

export const metadata: Metadata = {
  title: "TikShopDZ — Achat en ligne Algérie",
  description: "Commandez les produits tendances TikTok. Livraison dans les 48 wilayas d'Algérie. Paiement à la livraison.",
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <ShopNavbar />
      <main>{children}</main>
      <footer className="border-t border-[#1e1e1e] mt-16 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 text-sm">
            © 2025 TikShopDZ · Livraison dans les 48 wilayas · Paiement à la livraison
          </p>
          <p className="text-[#ff2d55] text-xs mt-1">🇩🇿 Fait avec ❤️ pour l&apos;Algérie</p>
        </div>
      </footer>
    </div>
  )
}
