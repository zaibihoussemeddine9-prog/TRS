"use client"
import { useEffect, useState } from "react"
import { RefreshCw, Search, Eye } from "lucide-react"
import Link from "next/link"
import { formatDZD } from "@/lib/shop/utils"
import { STATUS_LABELS } from "@/lib/shop/utils"

interface Order {
  id: string
  orderNumber: string
  firstName: string
  lastName: string
  phone: string
  wilayaName: string
  commune: string
  total: number
  status: string
  createdAt: string
  items: { quantity: number }[]
}

const ALL_STATUSES = ["TOUTES", "NOUVELLE", "CONFIRMEE", "EN_LIVRAISON", "LIVREE", "ANNULEE"]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState("TOUTES")
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function loadOrders() {
    setLoading(true)
    try {
      const res = await fetch("/api/shop/orders?limit=100")
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId)
    try {
      await fetch(`/api/shop/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    } catch {
      alert("Erreur lors de la mise à jour")
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = orders.filter((o) => {
    const matchStatus = activeStatus === "TOUTES" || o.status === activeStatus
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search)
    return matchStatus && matchSearch
  })

  const NEXT_STATUS: Record<string, string | null> = {
    NOUVELLE: "CONFIRMEE",
    CONFIRMEE: "EN_LIVRAISON",
    EN_LIVRAISON: "LIVREE",
    LIVREE: null,
    ANNULEE: null,
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Commandes</h1>
        <button onClick={loadOrders} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher par N°, nom, tél..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ff2d55]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeStatus === s ? "bg-[#ff2d55] text-white" : "bg-[#161616] text-gray-400 border border-[#2a2a2a] hover:text-white"
              }`}
            >
              {s === "TOUTES" ? "Toutes" : STATUS_LABELS[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#161616] rounded-2xl border border-[#222] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#222]">
                {["Commande", "Client", "Wilaya", "Total", "Statut", "Date", "Action"].map((h) => (
                  <th key={h} className="text-left text-gray-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-[#222] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-10">Aucune commande trouvée</td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const st = STATUS_LABELS[order.status] || STATUS_LABELS.NOUVELLE
                  const nextSt = NEXT_STATUS[order.status]
                  const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
                  return (
                    <tr key={order.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">#{order.orderNumber}</p>
                        <p className="text-gray-500 text-xs">{totalQty} article{totalQty > 1 ? "s" : ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-sm">{order.firstName} {order.lastName}</p>
                        <p className="text-gray-500 text-xs">{order.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-sm">{order.wilayaName}</p>
                        <p className="text-gray-500 text-xs">{order.commune}</p>
                      </td>
                      <td className="px-4 py-3 text-white font-semibold text-sm">{formatDZD(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString("fr-DZ")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {nextSt && (
                            <button
                              onClick={() => updateStatus(order.id, nextSt)}
                              disabled={updatingId === order.id}
                              className="text-xs bg-[#ff2d55]/10 text-[#ff2d55] hover:bg-[#ff2d55] hover:text-white px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                            >
                              {updatingId === order.id ? "..." : `→ ${STATUS_LABELS[nextSt]?.label}`}
                            </button>
                          )}
                          {order.status !== "ANNULEE" && order.status !== "LIVREE" && (
                            <button
                              onClick={() => updateStatus(order.id, "ANNULEE")}
                              disabled={updatingId === order.id}
                              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
