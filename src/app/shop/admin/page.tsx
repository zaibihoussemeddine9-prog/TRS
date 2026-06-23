"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, Package, TrendingUp, DollarSign, ArrowRight, RefreshCw } from "lucide-react"
import { formatDZD } from "@/lib/shop/utils"
import { STATUS_LABELS } from "@/lib/shop/utils"

interface Stats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  totalProducts: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  firstName: string
  lastName: string
  total: number
  status: string
  createdAt: string
  wilayaName: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch("/api/shop/orders?limit=5"),
        fetch("/api/shop/products?limit=1"),
      ])
      const ordersData = await ordersRes.json()
      const productsData = await productsRes.json()

      setRecentOrders(ordersData.orders || [])
      const orders = ordersData.orders || []
      setStats({
        totalOrders: ordersData.total || orders.length,
        totalRevenue: ordersData.totalRevenue || orders.reduce((s: number, o: RecentOrder) => s + o.total, 0),
        pendingOrders: orders.filter((o: RecentOrder) => o.status === "NOUVELLE").length,
        totalProducts: productsData.total || 0,
      })
    } catch {
      setStats({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, totalProducts: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const STAT_CARDS = stats
    ? [
        { icon: ShoppingBag, label: "Commandes totales", value: stats.totalOrders.toString(), color: "text-blue-400", bg: "bg-blue-400/10" },
        { icon: DollarSign, label: "Chiffre d'affaires", value: formatDZD(stats.totalRevenue), color: "text-green-400", bg: "bg-green-400/10" },
        { icon: TrendingUp, label: "Nouvelles commandes", value: stats.pendingOrders.toString(), color: "text-[#ff2d55]", bg: "bg-[#ff2d55]/10" },
        { icon: Package, label: "Produits actifs", value: stats.totalProducts.toString(), color: "text-purple-400", bg: "bg-purple-400/10" },
      ]
    : []

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <button onClick={loadData} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#161616] rounded-2xl p-5 border border-[#222] animate-pulse h-24" />
            ))
          : STAT_CARDS.map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-[#161616] rounded-2xl p-5 border border-[#222]">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-gray-500 text-xs mb-1">{label}</p>
                <p className="text-white font-bold text-lg">{value}</p>
              </div>
            ))}
      </div>

      <div className="bg-[#161616] rounded-2xl border border-[#222]">
        <div className="flex items-center justify-between p-5 border-b border-[#222]">
          <h2 className="text-white font-semibold">Dernières commandes</h2>
          <Link href="/shop/admin/orders" className="flex items-center gap-1 text-[#ff2d55] text-sm hover:underline">
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-[#1e1e1e]">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-[#222] rounded w-32" />
                  <div className="h-3 bg-[#222] rounded w-24" />
                </div>
                <div className="h-6 bg-[#222] rounded w-20" />
              </div>
            ))
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune commande pour le moment</div>
          ) : (
            recentOrders.map((order) => {
              const st = STATUS_LABELS[order.status] || STATUS_LABELS.NOUVELLE
              return (
                <div key={order.id} className="flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors">
                  <div>
                    <p className="text-white font-medium text-sm">#{order.orderNumber}</p>
                    <p className="text-gray-500 text-xs">
                      {order.firstName} {order.lastName} · {order.wilayaName}
                    </p>
                    <p className="text-gray-600 text-xs">{new Date(order.createdAt).toLocaleDateString("fr-DZ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold text-sm">{formatDZD(order.total)}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
