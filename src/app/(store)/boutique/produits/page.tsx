import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/store/ProductCard";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ categorie?: string; q?: string; tri?: string }>;
}

const SORT_OPTIONS = [
  { value: "popular", label: "Les plus populaires" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "new", label: "Nouveautés" },
];

export default async function ProduitsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { categorie, q, tri = "popular" } = params;

  const orderBy =
    tri === "price-asc"
      ? { price: "asc" as const }
      : tri === "price-desc"
      ? { price: "desc" as const }
      : tri === "new"
      ? { createdAt: "desc" as const }
      : { sold: "desc" as const };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        ...(categorie ? { category: { slug: categorie } } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      include: { category: true },
      orderBy,
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const activeCategory = categories.find((c) => c.slug === categorie);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="section-title">
          {activeCategory ? activeCategory.name : q ? `Résultats : "${q}"` : "Tous les produits"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{products.length} produit{products.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Catégories</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/boutique/produits"
                  className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    !categorie ? "bg-rose-50 text-rose-600" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Toutes
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/boutique/produits?categorie=${cat.slug}`}
                    className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      categorie === cat.slug
                        ? "bg-rose-50 text-rose-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Sort + Search */}
          <div className="flex flex-wrap gap-3 mb-5">
            <form method="GET" className="flex-1 min-w-48">
              <div className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Rechercher un produit..."
                  className="input-field pr-10 text-sm"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
            <div className="flex gap-2 flex-wrap">
              {SORT_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={`/boutique/produits?${categorie ? `categorie=${categorie}&` : ""}${q ? `q=${q}&` : ""}tri=${opt.value}`}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    tri === opt.value
                      ? "bg-rose-500 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
              <span className="text-5xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Aucun produit trouvé</h3>
              <p className="text-slate-500 mb-6">Essayez une autre recherche ou catégorie.</p>
              <Link href="/boutique/produits" className="btn-primary">
                Voir tous les produits
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
