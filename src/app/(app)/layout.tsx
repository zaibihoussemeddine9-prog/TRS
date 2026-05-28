"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Main content - takes all space minus bottom nav */}
      <div className="relative flex-1 overflow-hidden">
        {children}
      </div>
      {/* Fixed bottom navigation */}
      <BottomNav />
    </div>
  );
}
