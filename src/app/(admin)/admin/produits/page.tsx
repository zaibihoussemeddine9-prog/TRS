import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import ProductToggle from "./ProductToggle";

export default async function ProduitsAdminPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Produits</h1>
          <p className="text-slate-500 text-sm">{products.length} produit{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/produits/nouveau" className="btn-primary text-sm py-2.5 px-4">
          + Nouveau produit
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl mb-4 block">📦</span>
            <p className="text-slate-500 mb-4">Aucun produit encore</p>
            <Link href="/admin/produits/nouveau" className="btn-primary">
              Créer le premier produit
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {["Produit", "Catégorie", "Prix", "Stock", "Vendus", "Vedette", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                          {product.images[0] && (
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" unoptimized />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm max-w-48 truncate">{product.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                        {product.category?.name || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-rose-500 text-sm">{formatPrice(product.price)}</p>
                      {product.comparePrice && (
                        <p className="text-xs text-slate-400 line-through">{formatPrice(product.comparePrice)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${product.stock < 5 ? "text-red-500" : product.stock < 10 ? "text-amber-500" : "text-green-600"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{product.sold}</td>
                    <td className="px-4 py-3">
                      {product.featured ? (
                        <span className="text-yellow-500 font-bold">⭐</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ProductToggle productId={product.id} active={product.active} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/produits/${product.id}`}
                        className="text-rose-500 hover:text-rose-700 text-sm font-medium"
                      >
                        Modifier →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
