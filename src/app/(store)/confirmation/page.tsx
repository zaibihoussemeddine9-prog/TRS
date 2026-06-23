import { prisma } from "@/lib/prisma";
import { formatPrice, formatDateTime, ORDER_STATUSES } from "@/lib/utils";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ commande?: string }>;
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderNumber = params.commande;

  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      })
    : null;

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <span className="text-6xl mb-4 block">❌</span>
        <h2 className="text-2xl font-bold mb-4">Commande introuvable</h2>
        <Link href="/boutique" className="btn-primary">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const settings = await prisma.siteSetting.findMany();
  const s = Object.fromEntries(settings.map((x: { key: string; value: string }) => [x.key, x.value]));
  const whatsappMsg = encodeURIComponent(
    `Bonjour ! J'ai passé une commande #${order.orderNumber} sur ${s.siteName || "votre boutique"}. Je souhaite confirmer ma commande de ${formatPrice(order.total)}.`
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Commande confirmée !</h1>
        <p className="text-slate-500">
          Merci {order.firstName} ! Votre commande a été reçue avec succès.
        </p>
      </div>

      {/* Order card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-slate-500">Numéro de commande</p>
            <p className="font-bold text-xl text-slate-900 font-mono">#{order.orderNumber}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.color || "bg-slate-100"}`}>
            {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status}
          </span>
        </div>

        <div className="border-t pt-4 space-y-2 text-sm text-slate-600 mb-5">
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-medium text-slate-900">{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Livraison à</span>
            <span className="font-medium text-slate-900 text-right max-w-[200px]">
              {order.commune}, {order.wilaya}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Téléphone</span>
            <span className="font-medium text-slate-900">{order.phone}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t pt-4 space-y-3 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-700">{item.productName} × {item.quantity}</span>
              <span className="font-semibold text-slate-900">{formatPrice(item.total)}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Sous-total</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Livraison</span>
            {order.shippingFee === 0 ? (
              <span className="text-green-600 font-medium">Gratuite</span>
            ) : (
              <span>{formatPrice(order.shippingFee)}</span>
            )}
          </div>
          <div className="flex justify-between font-bold text-base mt-2">
            <span>Total à payer</span>
            <span className="text-rose-500">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-slate-50 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-slate-900 mb-3">Prochaines étapes</h3>
        <ol className="space-y-2 text-sm text-slate-600">
          <li className="flex gap-3">
            <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <span>Notre équipe va confirmer votre commande par téléphone.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <span>Votre colis sera préparé et expédié sous 24-48h.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <span>Vous payez le livreur à la réception. Simple et sécurisé !</span>
          </li>
        </ol>
      </div>

      {/* WhatsApp contact */}
      <a
        href={`https://wa.me/${s.whatsapp || "213555000000"}?text=${whatsappMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-colors mb-4"
      >
        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Suivre sur WhatsApp
      </a>

      <Link href="/boutique" className="btn-secondary w-full justify-center">
        Continuer les achats
      </Link>
    </div>
  );
}
