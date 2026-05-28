"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface User {
  name?: string | null;
  email?: string | null;
  role?: string;
}

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: "📊" },
  { href: "/admin/bookings", label: "Réservations", icon: "📅" },
  { href: "/admin/services", label: "Services", icon: "🚗" },
  { href: "/admin/settings", label: "Paramètres", icon: "⚙️" },
];

export default function AdminSidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center font-bold text-sm group-hover:bg-sky-400 transition-colors">AS</div>
          <div>
            <p className="font-bold text-sm">AutoSplash</p>
            <p className="text-xs text-slate-400">Administration</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-sky-500 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <div className="pt-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="text-lg">🌐</span>
            Voir le site
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center text-sm font-bold">
            {user.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <span>🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
