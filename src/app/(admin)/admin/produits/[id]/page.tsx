import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "../ProductForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProduitPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { category: true } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Modifier : {product.name}</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
