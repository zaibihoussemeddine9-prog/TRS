"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Zap,
  LayoutDashboard,
  Map,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/map", label: "Voir la carte", icon: Map },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/map");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") return null;

  return (
    <div className="flex h-full bg-slate-900 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-slate-700/50 bg-slate-900 transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-700/50 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-sm font-black text-white">ScootDZ</span>
              <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs font-semibold text-amber-400">
                Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        {/* User & logout */}
        <div className="border-t border-slate-700/50 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-white">{session.user.name}</p>
              <p className="truncate text-xs text-slate-500">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center border-b border-slate-700/50 bg-slate-900 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-3 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-slate-300">Administration — ScootDZ</h2>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
