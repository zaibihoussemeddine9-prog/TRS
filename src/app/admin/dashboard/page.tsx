import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, STATUS_COLORS, formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todayBookings,
    totalBookings,
    pendingCount,
    confirmedCount,
    completedCount,
    recentBookings,
    monthRevenue,
    settings,
  ] = await Promise.all([
    prisma.booking.count({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { service: true },
    }),
    prisma.booking.aggregate({
      where: {
        status: "COMPLETED",
        date: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
          lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
        },
      },
      _sum: { totalPrice: true },
    }),
    prisma.stationSettings.findUnique({ where: { id: "settings" } }),
  ]);

  return {
    todayBookings,
    totalBookings,
    pendingCount,
    confirmedCount,
    completedCount,
    recentBookings,
    monthRevenue: monthRevenue._sum.totalPrice || 0,
    currency: settings?.currency || "TND",
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const kpis = [
    { label: "Réservations aujourd'hui", value: data.todayBookings, icon: "📅", color: "bg-sky-500", light: "bg-sky-50 text-sky-700" },
    { label: "En attente", value: data.pendingCount, icon: "⏳", color: "bg-amber-500", light: "bg-amber-50 text-amber-700" },
    { label: "Confirmées", value: data.confirmedCount, icon: "✅", color: "bg-blue-500", light: "bg-blue-50 text-blue-700" },
    { label: "Chiffre du mois", value: formatPrice(data.monthRevenue, data.currency), icon: "💰", color: "bg-green-500", light: "bg-green-50 text-green-700" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 capitalize">{today}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${kpi.light}`}>
                {kpi.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{kpi.value}</p>
            <p className="text-sm text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Réservations récentes</h2>
          <Link href="/admin/bookings" className="text-sm text-sky-600 hover:text-sky-700 font-medium">
            Tout voir →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {data.recentBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-medium">Aucune réservation pour l'instant</p>
              <p className="text-sm">Les nouvelles réservations apparaîtront ici</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-6 py-3 text-left">Référence</th>
                  <th className="px-6 py-3 text-left">Client</th>
                  <th className="px-6 py-3 text-left">Service</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Statut</th>
                  <th className="px-6 py-3 text-right">Prix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-sky-600">{booking.reference}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 text-sm">{booking.customerName}</p>
                      <p className="text-slate-400 text-xs">{booking.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{booking.service.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(booking.date)} à {booking.timeSlot}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status] || "bg-slate-100 text-slate-600"}`}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                      {booking.totalPrice} {data.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
