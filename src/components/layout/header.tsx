"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Bell, Menu, LogOut, User } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrateur", RESPONSABLE: "Responsable", OPERATEUR: "Opérateur", LECTURE_SEULE: "Lecture seule",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenuToggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden" aria-label="Ouvrir le menu">
        <Menu className="h-6 w-6" />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 hover:bg-slate-100 transition-colors sm:gap-3 sm:px-3 sm:py-2">
            <UserAvatar name={session?.user?.name} size="sm" />
            <div className="hidden text-left text-sm sm:block">
              <p className="font-medium text-slate-900">{session?.user?.name || "Utilisateur"}</p>
              <p className="text-xs text-slate-500">{session?.user?.role ? roleLabels[session.user.role] || session.user.role : ""}</p>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
              <Link href="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <User className="h-4 w-4" /> Mon profil
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
