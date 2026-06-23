import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, MapPin, Phone, MessageCircle, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatDZD } from "@/lib/shop/utils"
import { STATUS_LABELS } from "@/lib/shop/utils"

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let order = null

  try {
    order = await prisma.shopOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    })
  } catch {
    // DB not available
  }

  if (!order) notFound()

  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.NOUVELLE

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Commande confirmée ! 🎉</h1>
        <p className="text-gray-400">Merci pour votre commande. Notre équipe vous contactera pour confirmer.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-[#161616] rounded-2xl p-5 border border-[#222]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-[#ff2d55]" />
              Commande #{order.orderNumber}
            </h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-300">
                  {item.product.name} <span className="text-gray-500">×{item.quantity}</span>
                </span>
                <span className="text-white font-medium">{formatDZD(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#2a2a2a] mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Sous-total</span>
              <span className="text-white">{formatDZD(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Livraison</span>
              <span className="text-white">{formatDZD(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-[#2a2a2a]">
              <span className="text-white">Total</span>
              <span className="text-[#ff2d55] text-lg">{formatDZD(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#161616] rounded-2xl p-5 border border-[#222] space-y-3">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#ff2d55]" />
            Livraison
          </h2>
          <p className="text-gray-300 text-sm">
            {order.firstName} {order.lastName}
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            {order.phone}
          </p>
          <p className="text-gray-400 text-sm">
            {order.address}, {order.commune}, {order.wilayaName}
          </p>
        </div>

        <div className="bg-[#1a0a12] rounded-2xl p-5 border border-[#ff2d55]/20">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-400" />
            Confirmation WhatsApp
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            Notre équipe vous contactera sur WhatsApp au {order.phone} pour confirmer votre commande et le délai de livraison.
          </p>
          <a
            href={`https://wa.me/213${order.phone.substring(1)}?text=Bonjour%2C%20je%20viens%20de%20passer%20la%20commande%20%23${order.orderNumber}%20sur%20TikShopDZ.%20Pouvez-vous%20confirmer%20%3F`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Confirmer sur WhatsApp
          </a>
        </div>

        <Link
          href="/shop"
          className="flex items-center justify-center gap-2 w-full bg-[#ff2d55] hover:bg-[#e0254b] text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          Continuer les achats
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
