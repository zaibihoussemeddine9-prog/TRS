"use client"
import Image from "next/image"
import Link from "next/link"
import { Trash2, ArrowLeft, ShoppingBag } from "lucide-react"
import { useCartStore } from "@/lib/shop/cart-store"
import { formatDZD } from "@/lib/shop/utils"

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()
  const subtotal = totalPrice()
  const estimatedDelivery = 600

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Votre panier est vide</h2>
        <p className="text-gray-400 mb-6">Découvrez nos produits tendances et ajoutez-les à votre panier.</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-[#ff2d55] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e0254b] transition-colors"
        >
          Découvrir les produits
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/shop" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Continuer les achats
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">
        Mon panier <span className="text-gray-500 text-lg font-normal">({items.length} article{items.length > 1 ? "s" : ""})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 bg-[#161616] rounded-2xl p-4 border border-[#222]">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <Image src={item.image || "/placeholder.png"} alt={item.name} fill className="object-cover" sizes="80px" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm leading-tight mb-2 line-clamp-2">{item.name}</p>
                <p className="text-[#ff2d55] font-bold">{formatDZD(item.price)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeItem(item.productId)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-8 h-8 text-white hover:bg-[#2a2a2a] transition-colors text-sm font-bold"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-white text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 text-white hover:bg-[#2a2a2a] transition-colors text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#222] sticky top-20">
            <h2 className="text-white font-bold text-lg mb-4">Récapitulatif</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Sous-total</span>
                <span className="text-white">{formatDZD(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Livraison (estimée)</span>
                <span className="text-white">{formatDZD(estimatedDelivery)}</span>
              </div>
              <div className="border-t border-[#2a2a2a] pt-3 flex justify-between font-bold">
                <span className="text-gray-200">Total estimé</span>
                <span className="text-white text-lg">{formatDZD(subtotal + estimatedDelivery)}</span>
              </div>
            </div>

            <Link
              href="/shop/checkout"
              className="block w-full bg-[#ff2d55] hover:bg-[#e0254b] text-white text-center font-bold py-3.5 rounded-xl transition-colors"
            >
              Passer la commande
            </Link>
            <p className="text-gray-600 text-xs text-center mt-3">
              💳 Paiement à la livraison uniquement
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
