"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { useState } from "react";

export default function StoreHeader({ siteName = "TikTok Shop DZ" }: { siteName?: string }) {
  const { itemCount, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/boutique" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl tiktok-gradient flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.89a8.2 8.2 0 004.8 1.54V7a4.85 4.85 0 01-1.03-.31z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-slate-900 hidden sm:block">{siteName}</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/boutique" className="text-slate-600 hover:text-rose-500 font-medium transition-colors text-sm">
            Accueil
          </Link>
          <Link href="/boutique/produits" className="text-slate-600 hover:text-rose-500 font-medium transition-colors text-sm">
            Produits
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Cart button */}
          <button
            onClick={openDrawer}
            className="relative p-2.5 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center cart-pop">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          {/* Mobile menu */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2">
          <Link
            href="/boutique"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-slate-700 font-medium hover:text-rose-500"
          >
            Accueil
          </Link>
          <Link
            href="/boutique/produits"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-slate-700 font-medium hover:text-rose-500"
          >
            Produits
          </Link>
        </div>
      )}
    </header>
  );
}
