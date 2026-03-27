"use client";

import { useSession } from "next-auth/react";
import { Bell, User } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrateur",
    DIRECTION: "Direction industrielle",
    RESP_PRODUCTION: "Resp. Production",
    RESP_MAINTENANCE: "Resp. Maintenance",
    RESP_QUALITE: "Resp. Qualité",
    SUPERVISEUR: "Superviseur",
    LECTURE_SEULE: "Lecture seule",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <User className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-900">{session?.user?.name || "Utilisateur"}</p>
            <p className="text-xs text-slate-500">
              {session?.user?.role ? roleLabels[session.user.role] || session.user.role : ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
