"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  History,
  Target,
  Settings,
  Factory,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/production", label: "Production", icon: ClipboardList },
  { href: "/downtimes", label: "Arrêts", icon: AlertTriangle },
  { href: "/analysis", label: "Analyse Pareto", icon: BarChart3 },
  { href: "/history", label: "Historique", icon: History },
  { href: "/actions", label: "Plans d'actions", icon: Target },
  { href: "/admin", label: "Administration", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <Factory className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-lg font-bold text-slate-900">PharmaTRS</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Suivi OEE</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </Link>
      </div>
    </aside>
  );
}
