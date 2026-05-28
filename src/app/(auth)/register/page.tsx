"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, User, Phone, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
      } else {
        router.push("/login?registered=1");
      }
    } catch {
      setError("Erreur réseau, veuillez réessayer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6 py-12">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
          <Zap className="h-8 w-8 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-black text-white">ScootDZ</h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-slate-800 p-8 shadow-2xl shadow-black/40">
        <h2 className="mb-6 text-xl font-bold text-white">Créer un compte</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Votre nom"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="vous@exemple.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Téléphone <span className="text-slate-500">(optionnel)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+213 5XX XXX XXX"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="8 caractères minimum"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Inscription...
              </>
            ) : (
              "Créer mon compte"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
