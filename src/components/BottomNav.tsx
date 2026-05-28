"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Search, History, User } from "lucide-react";

const navItems = [
  { href: "/map", label: "Carte", icon: Map },
  { href: "/search", label: "Chercher", icon: Search },
  { href: "/rides", label: "Mes courses", icon: History },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-700/60 bg-slate-900/95 backdrop-blur-md bottom-nav-safe">
      <div className="flex items-stretch">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span>{label}</span>
              {active && (
                <span className="absolute bottom-0 block h-0.5 w-6 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
