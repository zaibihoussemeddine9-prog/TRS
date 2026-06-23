"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useCart } from "./CartProvider";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images: string[];
  sold?: number;
  stock: number;
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, openDrawer } = useCart();
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity: 1,
      slug: product.slug,
    });
    openDrawer();
  }

  return (
    <Link href={`/boutique/produits/${product.slug}`} className="product-card block">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        )}
        {discount > 0 && (
          <span className="badge-sale">-{discount}%</span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-slate-800 font-bold px-3 py-1 rounded-full text-sm">Épuisé</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-rose-500 transition-colors mb-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-rose-500 font-bold text-lg">{formatPrice(product.price)}</span>
          {product.comparePrice && (
            <span className="text-slate-400 text-sm line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>

        {(product.sold || 0) > 0 && (
          <p className="text-xs text-slate-400 mb-3">{product.sold} vendus</p>
        )}

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-200 hover:shadow-md active:scale-95"
        >
          {product.stock === 0 ? "Épuisé" : "Ajouter au panier"}
        </button>
      </div>
    </Link>
  );
}
