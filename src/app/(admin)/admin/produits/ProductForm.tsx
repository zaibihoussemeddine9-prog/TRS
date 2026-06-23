"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  price: number;
  comparePrice?: number | null;
  images: string[];
  videoUrl?: string | null;
  stock: number;
  categoryId?: string | null;
  tags: string[];
  featured: boolean;
  active: boolean;
};

interface Props {
  categories: Category[];
  product?: Product;
}

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name || "",
    nameAr: product?.nameAr || "",
    description: product?.description || "",
    descriptionAr: product?.descriptionAr || "",
    price: product?.price?.toString() || "",
    comparePrice: product?.comparePrice?.toString() || "",
    images: product?.images?.join("\n") || "",
    videoUrl: product?.videoUrl || "",
    stock: product?.stock?.toString() || "0",
    categoryId: product?.categoryId || "",
    tags: product?.tags?.join(", ") || "",
    featured: product?.featured || false,
    active: product?.active !== false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      stock: parseInt(form.stock) || 0,
      categoryId: form.categoryId || null,
    };

    try {
      const url = isEdit ? `/api/produits/${product!.id}` : "/api/produits";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur serveur");
      }
      router.push("/admin/produits");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!product || !confirm("Supprimer ce produit ?")) return;
    await fetch(`/api/produits/${product.id}`, { method: "DELETE" });
    router.push("/admin/produits");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-900">Informations de base</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom du produit *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="Ex: Sérum Vitamine C" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom en arabe</label>
            <input type="text" name="nameAr" value={form.nameAr} onChange={handleChange} className="input-field text-right" dir="rtl" placeholder="اسم المنتج بالعربية" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prix (DA) *</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" step="1" className="input-field" placeholder="1500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prix barré (DA)</label>
            <input type="number" name="comparePrice" value={form.comparePrice} onChange={handleChange} min="0" step="1" className="input-field" placeholder="2000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
            <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field">
              <option value="">Aucune catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-900">Description</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description (Français)</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="input-field resize-none" placeholder="Décrivez votre produit..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description (Arabe)</label>
          <textarea name="descriptionAr" value={form.descriptionAr} onChange={handleChange} rows={3} className="input-field resize-none text-right" dir="rtl" placeholder="وصف المنتج..." />
        </div>
      </div>

      {/* Media */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-900">Images & Vidéo</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">URLs des images (une par ligne)</label>
          <textarea
            name="images"
            value={form.images}
            onChange={handleChange}
            rows={4}
            className="input-field resize-none font-mono text-sm"
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
          />
          <p className="text-xs text-slate-400 mt-1">Collez les URLs de vos images hébergées (Unsplash, Cloudinary, etc.)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lien vidéo TikTok/YouTube</label>
          <input type="url" name="videoUrl" value={form.videoUrl} onChange={handleChange} className="input-field" placeholder="https://www.tiktok.com/@..." />
        </div>
      </div>

      {/* Tags & Options */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-900">Tags & Options</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tags (séparés par virgule)</label>
          <input type="text" name="tags" value={form.tags} onChange={handleChange} className="input-field" placeholder="beauté, soin, naturel" />
        </div>
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="w-4 h-4 accent-rose-500 rounded" />
            <span className="text-sm font-medium text-slate-700">⭐ Produit vedette</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="w-4 h-4 accent-rose-500 rounded" />
            <span className="text-sm font-medium text-slate-700">✅ Produit actif</span>
          </label>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3.5 disabled:opacity-60">
          {loading ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer le produit"}
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} className="px-5 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-colors">
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
