"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  sortOrder: number;
  active: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", nameAr: "", sortOrder: "0" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) }),
    });
    setForm({ name: "", nameAr: "", sortOrder: "0" });
    setShowForm(false);
    setLoading(false);
    load();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Désactiver cette catégorie ?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Catégories</h1>
          <p className="text-slate-500 text-sm">{categories.length} catégorie{categories.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2.5 px-4">
          + Nouvelle catégorie
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-5 mb-6 space-y-4">
          <h2 className="font-bold text-slate-900">Nouvelle catégorie</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="input-field" placeholder="Mode & Vêtements" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom en arabe</label>
              <input type="text" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} className="input-field text-right" dir="rtl" placeholder="الموضة والملابس" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ordre</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">Créer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-4xl mb-3 block">🗂️</span>
            <p>Aucune catégorie</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                {["Nom", "Nom arabe", "Slug", "Ordre", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-right font-arabic" dir="rtl">{cat.nameAr || "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{cat.slug}</td>
                  <td className="px-4 py-3 text-slate-600">{cat.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600 text-sm">Désactiver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
