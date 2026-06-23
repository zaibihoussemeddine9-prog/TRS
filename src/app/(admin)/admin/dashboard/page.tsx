import { prisma } from "@/lib/prisma";
import { formatPrice, formatDateTime, ORDER_STATUSES } from "@/lib/utils";
import Link from "next/link";

async function getStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    totalOrders,
    pendingOrders,
    ordersThisMonth,
    revenueThisMonth,
    totalProducts,
    lowStockProducts,
    recentOrders,
    ordersByStatus,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { active: true, stock: { lt: 5 } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    ordersThisMonth,
    revenueThisMonth: revenueThisMonth._sum.total || 0,
    totalProducts,
    lowStockProducts,
    recentOrders,
    ordersByStatus,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const kpis = [
    {
      label: "Commandes en attente",
      value: stats.pendingOrders.toString(),
      sub: `${stats.totalOrders} total`,
      color: "bg-yellow-50 text-yellow-600",
      border: "border-yellow-200",
      icon: "⏳",
    },
    {
      label: "Commandes ce mois",
      value: stats.ordersThisMonth.toString(),
      sub: "30 derniers jours",
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-200",
      icon: "📦",
    },
    {
      label: "CA ce mois",
      value: formatPrice(stats.revenueThisMonth),
      sub: "Confirmées + Livrées",
      color: "bg-green-50 text-green-600",
      border: "border-green-200",
      icon: "💰",
    },
    {
      label: "Produits actifs",
      value: stats.totalProducts.toString(),
      sub: `${stats.lowStockProducts} en rupture`,
      color: "bg-rose-50 text-rose-600",
      border: "border-rose-200",
      icon: "🛍️",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Vue d'ensemble de votre boutique</p>
        </div>
        <Link href="/admin/produits/nouveau" className="btn-primary text-sm py-2.5 px-4">
          + Nouveau produit
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-2xl p-5 shadow-sm border ${kpi.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{kpi.icon}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.color}`}>
                {kpi.sub}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{kpi.value}</p>
            <p className="text-sm text-slate-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Dernières commandes</h2>
            <Link href="/admin/commandes" className="text-rose-500 text-sm font-medium hover:text-rose-600">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentOrders.map((order) => {
              const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
              return (
                <Link
                  key={order.id}
                  href={`/admin/commandes/${order.id}`}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-lg">
                      📦
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">#{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">
                        {order.firstName} {order.lastName} · {order.wilaya}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">{formatPrice(order.total)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo?.color || "bg-slate-100"}`}>
                      {statusInfo?.label || order.status}
                    </span>
                  </div>
                </Link>
              );
            })}
            {stats.recentOrders.length === 0 && (
              <p className="text-slate-400 text-center py-8">Aucune commande pour l'instant</p>
            )}
          </div>
        </div>

        {/* Orders by status */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-slate-900 mb-4">Statuts des commandes</h2>
          <div className="space-y-3">
            {Object.entries(ORDER_STATUSES).map(([key, { label, color }]) => {
              const count = stats.ordersByStatus.find((s) => s.status === key)?._count || 0;
              return (
                <Link
                  key={key}
                  href={`/admin/commandes?status=${key}`}
                  className="flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color.split(" ")[0]}`} />
                    <span className="text-sm text-slate-700">{label}</span>
                  </div>
                  <span className={`font-bold text-sm px-2 py-0.5 rounded-full ${color}`}>{count}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t">
            <h3 className="font-bold text-slate-900 mb-3 text-sm">Accès rapides</h3>
            <div className="space-y-2">
              <Link href="/admin/produits/nouveau" className="flex items-center gap-2 text-sm text-slate-600 hover:text-rose-500 transition-colors">
                <span>➕</span> Ajouter un produit
              </Link>
              <Link href="/admin/commandes?status=PENDING" className="flex items-center gap-2 text-sm text-slate-600 hover:text-rose-500 transition-colors">
                <span>⏳</span> Commandes en attente
              </Link>
              <Link href="/admin/parametres" className="flex items-center gap-2 text-sm text-slate-600 hover:text-rose-500 transition-colors">
                <span>⚙️</span> Paramètres boutique
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
