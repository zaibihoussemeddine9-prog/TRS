import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice, formatDateTime, ORDER_STATUSES } from "@/lib/utils";
import OrderStatusUpdater from "./OrderStatusUpdater";
import Link from "next/link";
import Image from "next/image";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CommandeDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) notFound();

  const settings = await prisma.siteSetting.findMany();
  const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));
  const whatsappMsg = encodeURIComponent(
    `Bonjour ${order.firstName} ! Votre commande #${order.orderNumber} sur ${s.siteName || "notre boutique"} est confirmée. Total: ${formatPrice(order.total)}. Nous vous livrerons dans les plus brefs délais.`
  );

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/commandes" className="text-slate-400 hover:text-slate-700">
          ← Retour
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Commande #{order.orderNumber}</h1>
          <p className="text-slate-500 text-sm">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-900 mb-4">Articles commandés</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {item.product.images[0] && (
                      <Image src={item.product.images[0]} alt={item.productName} fill className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{item.productName}</p>
                    <p className="text-slate-500 text-xs">Qté: {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <p className="font-bold text-slate-900">{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total</span><span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Livraison</span>
                <span>{order.shippingFee === 0 ? "Gratuite" : formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Total à payer</span>
                <span className="text-rose-500">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-900 mb-4">Informations client</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Prénom", value: order.firstName },
                { label: "Nom", value: order.lastName },
                { label: "Téléphone", value: order.phone },
                { label: "Téléphone 2", value: order.phone2 || "—" },
                { label: "Wilaya", value: order.wilaya },
                { label: "Commune", value: order.commune },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-slate-500">{label}</p>
                  <p className="font-medium text-slate-900">{value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-slate-500">Adresse</p>
                <p className="font-medium text-slate-900">{order.address}</p>
              </div>
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-slate-500">Notes</p>
                  <p className="font-medium text-slate-900">{order.notes}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500">Source</p>
                <p className="font-medium text-slate-900 capitalize">{order.source || "direct"}</p>
              </div>
            </div>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${order.phone.replace(/[^0-9]/g, "")}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contacter sur WhatsApp
            </a>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
        </div>
      </div>
    </div>
  );
}
