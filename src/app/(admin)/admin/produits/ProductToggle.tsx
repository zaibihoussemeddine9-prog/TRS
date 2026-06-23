"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductToggle({ productId, active }: { productId: string; active: boolean }) {
  const [checked, setChecked] = useState(active);
  const router = useRouter();

  async function toggle() {
    const newVal = !checked;
    setChecked(newVal);
    await fetch(`/api/produits/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: newVal }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
