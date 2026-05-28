"use client";

import { useEffect, useState } from "react";

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category: string;
  active: boolean;
  color: string;
  icon?: string;
  sortOrder: number;
}

const CATEGORIES = ["STANDARD", "PREMIUM", "SPECIAL"];
const ICONS = ["car", "droplets", "spray-can", "star", "settings", "sparkles"];
const ICON_LABELS: Record<string, string> = {
  car: "🚗 Voiture",
  droplets: "💧 Gouttes",
  "spray-can": "🧹 Spray",
  star: "⭐ Étoile",
  settings: "⚙️ Moteur",
  sparkles: "✨ Étincelles",
};
const COLORS = ["#0ea5e9", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#f97316", "#ec4899"];

const EMPTY_FORM = { name: "", description: "", duration: 30, price: 0, category: "STANDARD", active: true, color: "#0ea5e9", icon: "car", sortOrder: 0 };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/services");
    const data = await res.json();
    setServices(data.services || []);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price,
      category: service.category,
      active: service.active,
      color: service.color,
      icon: service.icon || "car",
      sortOrder: service.sortOrder,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editing ? `/api/admin/services/${editing.id}` : "/api/admin/services";
    const method = editing ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    fetchServices();
  };

  const toggleActive = async (service: Service) => {
    await fetch(`/api/admin/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });
    fetchServices();
  };

  const deleteService = async (id: string) => {
    if (!confirm("Supprimer ce service ?")) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    fetchServices();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Services</h1>
          <p className="text-slate-500">{services.length} service(s) configuré(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          + Nouveau service
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!service.active ? "opacity-60" : ""}`}>
              <div className="h-1.5" style={{ backgroundColor: service.color }}></div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{service.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${service.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {service.active ? "Actif" : "Inactif"}
                  </span>
                </div>
                {service.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{service.description}</p>}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="font-bold text-slate-900">{service.price} TND</span>
                  <span className="text-slate-400">{service.duration} min</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{service.category}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(service)} className="flex-1 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    Modifier
                  </button>
                  <button onClick={() => toggleActive(service)} className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${service.active ? "border border-amber-300 text-amber-700 hover:bg-amber-50" : "border border-green-300 text-green-700 hover:bg-green-50"}`}>
                    {service.active ? "Désactiver" : "Activer"}
                  </button>
                  <button onClick={() => deleteService(service.id)} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? "Modifier le service" : "Nouveau service"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du service *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prix (TND)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Durée (min)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Icône</label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    {ICONS.map((i) => <option key={i} value={i}>{ICON_LABELS[i]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-4 transition-transform hover:scale-110 ${form.color === c ? "border-slate-900 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ordre d'affichage</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="active-toggle"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 accent-sky-500"
                  />
                  <label htmlFor="active-toggle" className="text-sm font-medium text-slate-700">Service actif</label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex-1 py-2.5 text-sm bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl transition-colors font-medium"
              >
                {saving ? "Enregistrement..." : (editing ? "Mettre à jour" : "Créer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
