"use client";

import { useState } from "react";
import { useCart } from "@/components/store/CartProvider";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  slug: string;
  stock: number;
};

export default function AddToCartSection({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { addItem, openDrawer } = useCart();
  const router = useRouter();

  function handleAddToCart() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity: qty,
      slug: product.slug,
    });
    openDrawer();
  }

  function handleBuyNow() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity: qty,
      slug: product.slug,
    });
    router.push("/commander");
  }

  if (product.stock === 0) {
    return (
      <div className="bg-slate-100 rounded-2xl p-4 text-center">
        <p className="text-slate-500 font-semibold">Ce produit est actuellement épuisé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Qty selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700">Quantité :</span>
        <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors font-bold text-lg"
          >
            −
          </button>
          <span className="w-12 text-center font-bold text-slate-900">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors font-bold text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Buttons */}
      <button
        onClick={handleBuyNow}
        className="w-full btn-primary justify-center text-base py-4 rounded-2xl"
      >
        Commander maintenant 🛒
      </button>
      <button
        onClick={handleAddToCart}
        className="w-full btn-outline justify-center text-base py-4 rounded-2xl"
      >
        Ajouter au panier
      </button>
    </div>
  );
}
