"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES } from "@/lib/utils";

export default function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpdate() {
    setLoading(true);
    try {
      await fetch(`/api/commandes/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="font-bold text-slate-900 mb-4">Statut de la commande</h2>

      <div className="space-y-2 mb-5">
        {Object.entries(ORDER_STATUSES).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${
              status === key
                ? "border-rose-400 bg-rose-50"
                : "border-slate-100 hover:border-slate-200"
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${color.split(" ")[0]}`} />
            <span className={`text-sm font-semibold ${status === key ? "text-rose-700" : "text-slate-600"}`}>
              {label}
            </span>
            {status === key && (
              <span className="ml-auto text-rose-500">✓</span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleUpdate}
        disabled={loading || status === currentStatus}
        className="w-full btn-primary justify-center py-3 disabled:opacity-50"
      >
        {loading ? "Mise à jour..." : "Mettre à jour"}
      </button>
    </div>
  );
}
