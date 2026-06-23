import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";

export default async function NouveauProduitPage() {
  const categories = await prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Nouveau produit</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
