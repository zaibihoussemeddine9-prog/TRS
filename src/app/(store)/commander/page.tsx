"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/store/CartProvider";
import { formatPrice } from "@/lib/utils";
import { WILAYAS } from "@/lib/wilayas";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CommanderPage() {
  const { state, total, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const SHIPPING = 400;
  const FREE_SHIPPING_THRESHOLD = 5000;
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING;
  const grandTotal = total + shipping;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    phone2: "",
    wilaya: "",
    commune: "",
    address: "",
    notes: "",
    source: "direct",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.items.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: state.items.map((i) => ({
            productId: i.id,
            productName: i.name,
            quantity: i.quantity,
            price: i.price,
            total: i.price * i.quantity,
          })),
          subtotal: total,
          shippingFee: shipping,
          total: grandTotal,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la commande");
      }

      const { orderNumber } = await res.json();
      clearCart();
      router.push(`/confirmation?commande=${orderNumber}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl mb-4 block">🛒</span>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Votre panier est vide</h2>
        <p className="text-slate-500 mb-6">Ajoutez des produits avant de passer commande.</p>
        <Link href="/boutique/produits" className="btn-primary">
          Découvrir les produits
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="section-title mb-8">Commander</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Personal info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="06 XX XX XX XX"
                  pattern="[0-9+\s-]{9,15}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone 2 (optionnel)</label>
                <input
                  type="tel"
                  name="phone2"
                  value={form.phone2}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Autre numéro"
                />
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Adresse de livraison
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wilaya *</label>
                <select
                  name="wilaya"
                  value={form.wilaya}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Sélectionner votre wilaya</option>
                  {WILAYAS.map((w) => (
                    <option key={w.code} value={w.name}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commune / Ville *</label>
                <input
                  type="text"
                  name="commune"
                  value={form.commune}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Votre commune"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse complète *</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Rue, quartier, numéro..."
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Source & Notes
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comment avez-vous trouvé ce produit ?</label>
                <select name="source" value={form.source} onChange={handleChange} className="input-field">
                  <option value="tiktok">TikTok</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="ami">Recommandé par un ami</option>
                  <option value="direct">Recherche directe</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes pour la livraison (optionnel)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Instructions spéciales, couleur préférée..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            <h2 className="font-bold text-slate-900 text-lg mb-4">Récapitulatif</h2>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {state.items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">Qté: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-rose-500 flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Sous-total</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Livraison</span>
                {shipping === 0 ? (
                  <span className="text-green-600 font-medium">Gratuite !</span>
                ) : (
                  <span className="font-medium">{formatPrice(shipping)}</span>
                )}
              </div>
              {total < FREE_SHIPPING_THRESHOLD && (
                <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-2 py-1">
                  Encore {formatPrice(FREE_SHIPPING_THRESHOLD - total)} pour la livraison gratuite
                </p>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Total</span>
                <span className="text-rose-500">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-4 bg-green-50 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium">Paiement à la livraison</span>
            </div>

            {error && (
              <div className="mt-3 bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center text-base py-4 rounded-2xl mt-4 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Traitement en cours...
                </span>
              ) : (
                "Confirmer la commande"
              )}
            </button>

            <p className="text-xs text-slate-400 text-center mt-3">
              En commandant, vous acceptez nos conditions de vente.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
