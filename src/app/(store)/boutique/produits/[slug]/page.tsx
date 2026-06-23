import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import AddToCartSection from "./AddToCartSection";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: { category: true },
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: {
      active: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    orderBy: { sold: "desc" },
  });

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/boutique" className="hover:text-rose-500">Accueil</Link>
        <span>/</span>
        <Link href="/boutique/produits" className="hover:text-rose-500">Produits</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/boutique/produits?categorie=${product.category.slug}`} className="hover:text-rose-500">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-800 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-sm">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-sm">
                -{discount}%
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {product.images.slice(0, 4).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <span className="inline-block bg-rose-50 text-rose-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {product.category.name}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">{product.name}</h1>
          {product.nameAr && (
            <p className="text-lg text-slate-500 font-arabic mb-4" dir="rtl">{product.nameAr}</p>
          )}

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-extrabold text-rose-500">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span className="text-lg text-slate-400 line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[
              { icon: "🚚", text: "Livraison nationale" },
              { icon: "💳", text: "Paiement à la livraison" },
              { icon: "🔄", text: "Retour facile" },
              { icon: "✅", text: "Produit authentique" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 text-xs font-medium text-slate-700">
                <span className="text-base">{icon}</span>
                {text}
              </div>
            ))}
          </div>

          <AddToCartSection product={product} />

          {product.description && (
            <div className="mt-8 bg-slate-50 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-3">Description</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {product.stock > 0 && product.stock < 10 && (
            <p className="mt-4 text-amber-600 text-sm font-medium flex items-center gap-1">
              <span>⚠️</span>
              Plus que {product.stock} en stock
            </p>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">Produits similaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link key={p.id} href={`/boutique/produits/${p.slug}`} className="product-card block">
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  {p.images[0] && (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1">{p.name}</p>
                  <p className="text-rose-500 font-bold">{formatPrice(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
