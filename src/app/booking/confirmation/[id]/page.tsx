import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

async function getBooking(reference: string) {
  return prisma.booking.findUnique({
    where: { reference },
    include: { service: true },
  });
}

const ICONS: Record<string, string> = {
  droplets: "💧",
  "spray-can": "🧹",
  car: "🚗",
  star: "⭐",
  settings: "⚙️",
  sparkles: "✨",
};

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const bookingDate = new Date(booking.date);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">AS</div>
            <span className="font-bold text-slate-900">AutoSplash</span>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Success header */}
          <div className="bg-green-50 px-8 py-10 text-center border-b border-green-100">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4">✓</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Réservation confirmée !</h1>
            <p className="text-slate-600">Votre réservation a bien été enregistrée. Nous vous attendons !</p>
          </div>

          {/* Reference */}
          <div className="px-8 py-6 bg-sky-50 border-b border-sky-100 text-center">
            <p className="text-sm text-slate-500 mb-1">Numéro de réservation</p>
            <p className="text-3xl font-bold font-mono tracking-widest text-sky-600">{booking.reference}</p>
            <p className="text-xs text-slate-400 mt-1">Gardez ce numéro pour toute modification</p>
          </div>

          {/* Details */}
          <div className="p-8 space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <span className="text-3xl">{ICONS[booking.service.icon || "car"] || "🚗"}</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{booking.service.name}</p>
                <p className="text-sm text-slate-500">{booking.service.duration} minutes</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-slate-900">{booking.totalPrice} TND</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Date & Heure</p>
                <p className="font-semibold text-slate-900">
                  {bookingDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="text-sky-600 font-bold text-lg">{booking.timeSlot}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Client</p>
                <p className="font-semibold text-slate-900">{booking.customerName}</p>
                <p className="text-slate-600 text-sm">{booking.customerPhone}</p>
              </div>
            </div>

            {(booking.carBrand || booking.carModel || booking.carPlate) && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Véhicule</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚗</span>
                  <div>
                    {(booking.carBrand || booking.carModel) && (
                      <p className="font-medium text-slate-900">{[booking.carBrand, booking.carModel].filter(Boolean).join(" ")}</p>
                    )}
                    {booking.carPlate && <p className="text-slate-600 text-sm font-mono">{booking.carPlate}</p>}
                    {booking.carColor && <p className="text-slate-500 text-sm">{booking.carColor}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm font-medium text-amber-800 mb-1">⚠️ Rappel important</p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Présentez-vous 5 minutes avant votre créneau</li>
                <li>• En cas d'empêchement, annulez à l'avance par téléphone</li>
                <li>• Conservez votre numéro de réservation: <strong>{booking.reference}</strong></li>
              </ul>
            </div>
          </div>

          <div className="px-8 py-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 text-center py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Retour à l'accueil
            </Link>
            <Link
              href="/booking"
              className="flex-1 text-center py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors"
            >
              Nouvelle réservation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
