"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else {
        router.push("/map");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6 py-12">
      {/* Brand */}
      <div className="mb-10 flex flex-col items-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
          <Zap className="h-10 w-10 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">ScootDZ</h1>
        <p className="mt-1 text-sm text-slate-400">Location de trottinettes à Alger</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-slate-800 p-8 shadow-2xl shadow-black/40">
        <h2 className="mb-6 text-xl font-bold text-white">Connexion</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
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
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
            S&apos;inscrire
          </Link>
        </p>
      </div>

      {/* Demo creds */}
      <div className="mt-6 w-full max-w-sm rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Comptes démo</p>
        <div className="space-y-1 font-mono text-xs text-slate-400">
          <p>admin@scoot.dz · Admin123!</p>
          <p>rider@scoot.dz · Rider123!</p>
        </div>
      </div>
    </div>
  );
}
