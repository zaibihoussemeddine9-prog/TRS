"use client";

import { useState, useEffect } from "react";

const SETTING_GROUPS = [
  {
    title: "Boutique",
    icon: "🏪",
    fields: [
      { key: "siteName", label: "Nom de la boutique", type: "text" },
      { key: "bannerTitle", label: "Titre de la bannière", type: "text" },
      { key: "bannerSubtitle", label: "Sous-titre bannière", type: "text" },
    ],
  },
  {
    title: "Contact",
    icon: "📞",
    fields: [
      { key: "whatsapp", label: "Numéro WhatsApp (ex: 213555000000)", type: "text" },
      { key: "phone", label: "Téléphone affiché", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "address", label: "Adresse", type: "text" },
    ],
  },
  {
    title: "Livraison",
    icon: "🚚",
    fields: [
      { key: "shippingFee", label: "Frais de livraison (DA)", type: "number" },
      { key: "freeShippingThreshold", label: "Livraison gratuite à partir de (DA)", type: "number" },
    ],
  },
  {
    title: "Réseaux sociaux",
    icon: "📱",
    fields: [
      { key: "tiktokUrl", label: "URL TikTok", type: "url" },
      { key: "instagramUrl", label: "URL Instagram", type: "url" },
      { key: "facebookUrl", label: "URL Facebook", type: "url" },
    ],
  },
];

export default function ParametresPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/parametres").then((r) => r.json()).then(setSettings);
  }, []);

  function handleChange(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setLoading(true);
    await fetch("/api/parametres", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Paramètres</h1>
          <p className="text-slate-500 text-sm">Configuration de votre boutique</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`btn-primary py-2.5 px-5 ${saved ? "bg-green-500 hover:bg-green-600" : ""}`}
        >
          {loading ? "Enregistrement..." : saved ? "✓ Enregistré !" : "Enregistrer"}
        </button>
      </div>

      <div className="space-y-6">
        {SETTING_GROUPS.map((group) => (
          <div key={group.title} className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>{group.icon}</span>
              {group.title}
            </h2>
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={settings[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="input-field"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
