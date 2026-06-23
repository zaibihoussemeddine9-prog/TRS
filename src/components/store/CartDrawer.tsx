"use client";

import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function CartDrawer() {
  const { state, closeDrawer, removeItem, updateQty, total, itemCount } = useCart();

  return (
    <>
      {state.isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeDrawer}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          state.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-slate-900">
            Mon Panier
            {itemCount > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-sm font-bold rounded-full px-2 py-0.5">
                {itemCount}
              </span>
            )}
          </h2>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="font-medium text-lg">Votre panier est vide</p>
              <p className="text-sm mt-1">Découvrez nos produits</p>
              <button
                onClick={closeDrawer}
                className="mt-4 btn-primary text-sm px-5 py-2.5"
              >
                Continuer les achats
              </button>
            </div>
          ) : (
            state.items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-slate-50 rounded-2xl p-3">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{item.name}</p>
                  <p className="text-rose-500 font-bold mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {state.items.length > 0 && (
          <div className="p-5 border-t bg-white space-y-3">
            <div className="flex justify-between text-lg font-bold text-slate-900">
              <span>Total</span>
              <span className="text-rose-500">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-slate-500 text-center">Livraison calculée à la commande</p>
            <Link
              href="/commander"
              onClick={closeDrawer}
              className="btn-primary w-full justify-center text-base py-4"
            >
              Commander maintenant
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
