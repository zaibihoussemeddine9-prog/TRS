"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Package, MapPin, Phone, User, MessageSquare, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useCartStore } from "@/lib/shop/cart-store"
import { formatDZD } from "@/lib/shop/utils"
import { WILAYAS } from "@/data/wilayas"

const schema = z.object({
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  phone: z.string().regex(/^(05|06|07)\d{8}$/, "Numéro algérien invalide (ex: 0555123456)"),
  wilayaId: z.string().min(1, "Sélectionnez une wilaya"),
  commune: z.string().min(1, "Sélectionnez une commune"),
  address: z.string().min(5, "Adresse trop courte"),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCartStore()
  const [submitting, setSubmitting] = useState(false)
  const [selectedWilaya, setSelectedWilaya] = useState<(typeof WILAYAS)[0] | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const subtotal = totalPrice()
  const deliveryFee = selectedWilaya?.deliveryFee ?? 600
  const total = subtotal + deliveryFee

  function handleWilayaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const wilaya = WILAYAS.find((w) => w.id === Number(e.target.value))
    setSelectedWilaya(wilaya || null)
    setValue("wilayaId", e.target.value)
    setValue("commune", "")
  }

  async function onSubmit(data: FormData) {
    if (items.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          wilayaId: Number(data.wilayaId),
          wilayaName: selectedWilaya?.name,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.price })),
          subtotal,
          deliveryFee,
          total,
        }),
      })
      if (!res.ok) throw new Error("Erreur lors de la commande")
      const order = await res.json()
      clearCart()
      router.push(`/shop/order/${order.id}`)
    } catch (err) {
      alert("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-white text-xl font-bold mb-4">Votre panier est vide</p>
        <Link href="/shop" className="text-[#ff2d55] hover:underline">Retour à la boutique</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/shop/cart" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour au panier
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Finaliser la commande</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-4">
          {/* Personal Info */}
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#222]">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#ff2d55]" />
              Informations personnelles
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  {...register("firstName")}
                  placeholder="Prénom *"
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff2d55] transition-colors"
                />
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <input
                  {...register("lastName")}
                  placeholder="Nom *"
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff2d55] transition-colors"
                />
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#222]">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#ff2d55]" />
              Numéro de téléphone
            </h2>
            <div>
              <div className="flex gap-2">
                <span className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-gray-400 text-sm">🇩🇿 +213</span>
                <input
                  {...register("phone")}
                  placeholder="0555 12 34 56 *"
                  type="tel"
                  maxLength={10}
                  className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff2d55] transition-colors"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Address */}
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#222]">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#ff2d55]" />
              Adresse de livraison
            </h2>
            <div className="space-y-3">
              <div>
                <select
                  onChange={handleWilayaChange}
                  defaultValue=""
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ff2d55] transition-colors appearance-none"
                >
                  <option value="" disabled>Sélectionner la wilaya *</option>
                  {WILAYAS.map((w) => (
                    <option key={w.id} value={w.id}>
                      ({w.id.toString().padStart(2, "0")}) {w.name} — {w.nameAr}
                    </option>
                  ))}
                </select>
                {errors.wilayaId && <p className="text-red-400 text-xs mt-1">{errors.wilayaId.message}</p>}
              </div>

              {selectedWilaya && (
                <div>
                  <select
                    {...register("commune")}
                    defaultValue=""
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ff2d55] transition-colors appearance-none"
                  >
                    <option value="" disabled>Sélectionner la commune *</option>
                    {selectedWilaya.communes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Autre">Autre commune</option>
                  </select>
                  {errors.commune && <p className="text-red-400 text-xs mt-1">{errors.commune.message}</p>}
                </div>
              )}

              <div>
                <input
                  {...register("address")}
                  placeholder="Adresse complète (rue, cité, quartier...) *"
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff2d55] transition-colors"
                />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#222]">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#ff2d55]" />
              Notes (optionnel)
            </h2>
            <textarea
              {...register("notes")}
              placeholder="Instructions spéciales pour la livraison..."
              rows={3}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff2d55] transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#ff2d55] hover:bg-[#e0254b] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-colors active:scale-95"
          >
            {submitting ? "Traitement en cours..." : `✅ Confirmer la commande — ${formatDZD(total)}`}
          </button>
          <p className="text-gray-600 text-xs text-center">💳 Paiement à la livraison · Aucun prépaiement requis</p>
        </form>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#222] sticky top-20">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#ff2d55]" />
              Ma commande
            </h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image src={item.image || "/placeholder.png"} alt={item.name} fill className="object-cover" sizes="48px" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">×{item.quantity}</p>
                  </div>
                  <p className="text-white text-xs font-semibold shrink-0">{formatDZD(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#2a2a2a] pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Sous-total</span>
                <span className="text-white">{formatDZD(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Livraison</span>
                <span className={selectedWilaya ? "text-white" : "text-gray-500"}>
                  {selectedWilaya ? formatDZD(deliveryFee) : "À définir"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-[#2a2a2a]">
                <span className="text-white">Total</span>
                <span className="text-[#ff2d55]">{formatDZD(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
