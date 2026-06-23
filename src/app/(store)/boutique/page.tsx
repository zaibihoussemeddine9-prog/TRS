import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/store/ProductCard";
import Link from "next/link";

async function getData() {
  const [featuredProducts, categories, settings] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, featured: true },
      include: { category: true },
      orderBy: { sold: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.siteSetting.findMany(),
  ]);
  const s = Object.fromEntries(settings.map((x: { key: string; value: string }) => [x.key, x.value]));
  return { featuredProducts, categories, settings: s };
}

const CATEGORY_EMOJIS: Record<string, string> = {
  "mode-vetements": "👗",
  "beaute-cosmetiques": "💄",
  electronique: "📱",
  "maison-deco": "🏠",
  "sport-fitness": "💪",
  enfants: "🧸",
};

export default async function HomePage() {
  const { featuredProducts, categories, settings } = await getData();

  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden tiktok-gradient text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium mb-6">
            <span>🔥</span>
            <span>Tendances TikTok en Algérie</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            {settings.bannerTitle || "Les Meilleures Tendances TikTok"}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            {settings.bannerSubtitle || "Livraison dans toute l'Algérie • Paiement à la livraison"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/boutique/produits"
              className="bg-white text-rose-600 font-bold px-8 py-4 rounded-2xl hover:bg-rose-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Découvrir les produits
            </Link>
            <Link
              href="/commander"
              className="bg-white/20 backdrop-blur-sm border-2 border-white/50 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/30 transition-all duration-200"
            >
              Commander maintenant
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <div className="relative bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm font-medium text-white/90">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚚</span>
                <span>Livraison nationale</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💳</span>
                <span>Paiement à la livraison</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span>Achat sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📞</span>
                <span>Support WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="section-title mb-6">Catégories</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {categories.map((cat: { id: string; name: string; slug: string }) => (
              <Link
                key={cat.id}
                href={`/boutique/produits?categorie=${cat.slug}`}
                className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center group"
              >
                <span className="text-3xl">{CATEGORY_EMOJIS[cat.slug] || "🛍️"}</span>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-rose-500 transition-colors leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
            <Link
              href="/boutique/produits"
              className="flex flex-col items-center gap-2 bg-rose-50 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center"
            >
              <span className="text-3xl">🛍️</span>
              <span className="text-xs font-semibold text-rose-500 leading-tight">Tout voir</span>
            </Link>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">🔥 Produits Vedettes</h2>
              <p className="text-slate-500 text-sm mt-1">Les plus populaires du moment</p>
            </div>
            <Link
              href="/boutique/produits"
              className="text-rose-500 font-semibold hover:text-rose-600 text-sm flex items-center gap-1"
            >
              Voir tout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {featuredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* TikTok CTA */}
      <section className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4 tiktok-gradient rounded-2xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-9 h-9 fill-white">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.89a8.2 8.2 0 004.8 1.54V7a4.85 4.85 0 01-1.03-.31z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold mb-3">Vous avez vu ça sur TikTok ?</h2>
          <p className="text-slate-300 mb-6">
            Commandez directement via notre boutique. Livraison rapide, paiement à la réception !
          </p>
          <Link
            href="/boutique/produits"
            className="btn-primary"
          >
            Commander maintenant
          </Link>
        </div>
      </section>
    </>
  );
}
