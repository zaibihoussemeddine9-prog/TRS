import { prisma } from "@/lib/prisma";
import { formatPrice, formatDateTime, ORDER_STATUSES, OrderStatus } from "@/lib/utils";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function CommandesPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status as OrderStatus | undefined;
  const page = parseInt(params.page || "1");
  const limit = 20;

  const where = status ? { status } : {};
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Commandes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} commande{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Link
          href="/admin/commandes"
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            !status ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Toutes ({total})
        </Link>
        {Object.entries(ORDER_STATUSES).map(([key, { label, color }]) => (
          <Link
            key={key}
            href={`/admin/commandes?status=${key}`}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              status === key ? `${color} ring-2 ring-offset-1` : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-4xl mb-3 block">📭</span>
            <p>Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["N° Commande", "Client", "Wilaya", "Produits", "Total", "Source", "Statut", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => {
                  const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-bold text-slate-900">#{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 text-sm">{order.firstName} {order.lastName}</p>
                        <p className="text-xs text-slate-500">{order.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{order.wilaya}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{order.items.length} article{order.items.length !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-rose-500 text-sm">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg capitalize">
                          {order.source || "direct"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo?.color || "bg-slate-100"}`}>
                          {statusInfo?.label || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/commandes/${order.id}`}
                          className="text-rose-500 hover:text-rose-700 text-sm font-medium"
                        >
                          Détails →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/commandes?${status ? `status=${status}&` : ""}page=${p}`}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                p === page ? "bg-rose-500 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
