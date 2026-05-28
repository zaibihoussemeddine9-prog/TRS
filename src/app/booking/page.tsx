"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  color: string;
  icon: string;
}

interface Settings {
  name: string;
  openingTime: string;
  closingTime: string;
  slotDuration: number;
  currency: string;
  workingDays: string;
}

const ICONS: Record<string, string> = {
  droplets: "💧",
  "spray-can": "🧹",
  car: "🚗",
  star: "⭐",
  settings: "⚙️",
  sparkles: "✨",
};

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const CAR_COLORS = ["Blanc", "Noir", "Gris", "Argent", "Rouge", "Bleu", "Vert", "Jaune", "Marron", "Beige", "Orange", "Autre"];

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedService = searchParams.get("service");

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    serviceId: preselectedService || "",
    date: "",
    timeSlot: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    carBrand: "",
    carModel: "",
    carPlate: "",
    carColor: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/public/services")
      .then((r) => r.json())
      .then((data) => setServices(data.services || []));
    fetch("/api/public/slots")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  useEffect(() => {
    if (form.date && form.serviceId && settings) {
      setLoading(true);
      fetch(`/api/public/slots?date=${form.date}&serviceId=${form.serviceId}`)
        .then((r) => r.json())
        .then((data) => { setSlots(data.slots || []); setLoading(false); });
    }
  }, [form.date, form.serviceId, settings]);

  const selectedService = services.find((s) => s.id === form.serviceId);

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const isWorkingDay = (dateStr: string) => {
    if (!settings) return true;
    const day = new Date(dateStr).getDay();
    const workingDays = settings.workingDays.split(",").map(Number);
    return workingDays.includes(day);
  };

  const validate = (currentStep: number) => {
    const errs: Record<string, string> = {};
    if (currentStep === 1 && !form.serviceId) errs.serviceId = "Veuillez choisir un service";
    if (currentStep === 2) {
      if (!form.date) errs.date = "Veuillez choisir une date";
      else if (!isWorkingDay(form.date)) errs.date = "Cette journée n'est pas travaillée";
      if (!form.timeSlot) errs.timeSlot = "Veuillez choisir un créneau horaire";
    }
    if (currentStep === 3) {
      if (!form.customerName.trim()) errs.customerName = "Nom requis";
      if (!form.customerPhone.trim()) errs.customerPhone = "Téléphone requis";
      else if (form.customerPhone.trim().length < 8) errs.customerPhone = "Numéro invalide";
      if (form.customerEmail && !/\S+@\S+\.\S+/.test(form.customerEmail)) errs.customerEmail = "Email invalide";
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    const errs = validate(3);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.booking) {
        router.push(`/booking/confirmation/${data.booking.reference}`);
      } else {
        alert(data.error || "Une erreur est survenue");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">AS</div>
            <span className="font-bold text-slate-900">{settings?.name || "AutoSplash"}</span>
          </Link>
          <span className="text-sm text-slate-500">Réservation en ligne</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s < step ? "bg-green-500 text-white" : s === step ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  {s < step ? "✓" : s}
                </div>
                {s < 4 && <div className={`w-12 h-0.5 ${s < step ? "bg-green-500" : "bg-slate-200"}`}></div>}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 text-xs text-slate-500">
            <span className={step === 1 ? "text-sky-600 font-medium" : ""}>Service</span>
            <span className={step === 2 ? "text-sky-600 font-medium" : ""}>Date & Heure</span>
            <span className={step === 3 ? "text-sky-600 font-medium" : ""}>Informations</span>
            <span className={step === 4 ? "text-sky-600 font-medium" : ""}>Confirmation</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Step 1: Choose service */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Choisissez votre formule</h2>
              <p className="text-slate-500 mb-6">Sélectionnez la prestation souhaitée</p>
              {errors.serviceId && <p className="text-red-600 text-sm mb-4">{errors.serviceId}</p>}
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => update("serviceId", service.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      form.serviceId === service.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{ICONS[service.icon] || "🚗"}</span>
                      {form.serviceId === service.id && (
                        <div className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{service.name}</h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{service.price} {settings?.currency || "TND"}</span>
                      <span className="text-xs text-slate-400">{service.duration} min</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Choisissez votre créneau</h2>
              <p className="text-slate-500 mb-6">Sélectionnez une date et un horaire disponible</p>
              {selectedService && (
                <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl mb-6">
                  <span className="text-2xl">{ICONS[selectedService.icon] || "🚗"}</span>
                  <div>
                    <p className="font-medium text-slate-900">{selectedService.name}</p>
                    <p className="text-sm text-slate-500">{selectedService.duration} min — {selectedService.price} {settings?.currency || "TND"}</p>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    min={getMinDate()}
                    value={form.date}
                    onChange={(e) => { update("date", e.target.value); update("timeSlot", ""); }}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
                  {form.date && !isWorkingDay(form.date) && (
                    <p className="text-amber-600 text-xs mt-1">Cette journée n'est pas travaillée. Veuillez choisir une autre date.</p>
                  )}
                </div>
                {form.date && isWorkingDay(form.date) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Créneaux disponibles</label>
                    {loading ? (
                      <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin"></div>
                        Chargement des créneaux...
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-slate-500 text-sm py-4 text-center bg-slate-50 rounded-xl">
                        Aucun créneau disponible pour cette date. Essayez un autre jour.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => update("timeSlot", slot)}
                            className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              form.timeSlot === slot
                                ? "bg-sky-500 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.timeSlot && <p className="text-red-600 text-xs mt-2">{errors.timeSlot}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Customer info */}
          {step === 3 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Vos informations</h2>
              <p className="text-slate-500 mb-6">Complétez vos coordonnées et les informations du véhicule</p>
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
                    <input
                      type="text"
                      placeholder="Prénom Nom"
                      value={form.customerName}
                      onChange={(e) => update("customerName", e.target.value)}
                      className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.customerName ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:border-sky-500 focus:ring-sky-500"}`}
                    />
                    {errors.customerName && <p className="text-red-600 text-xs mt-1">{errors.customerName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      placeholder="+216 XX XXX XXX"
                      value={form.customerPhone}
                      onChange={(e) => update("customerPhone", e.target.value)}
                      className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.customerPhone ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:border-sky-500 focus:ring-sky-500"}`}
                    />
                    {errors.customerPhone && <p className="text-red-600 text-xs mt-1">{errors.customerPhone}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email (facultatif)</label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={form.customerEmail}
                    onChange={(e) => update("customerEmail", e.target.value)}
                    className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.customerEmail ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:border-sky-500 focus:ring-sky-500"}`}
                  />
                  {errors.customerEmail && <p className="text-red-600 text-xs mt-1">{errors.customerEmail}</p>}
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Informations du véhicule (facultatif)</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Marque</label>
                      <input
                        type="text"
                        placeholder="Ex: Toyota, Renault..."
                        value={form.carBrand}
                        onChange={(e) => update("carBrand", e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Modèle</label>
                      <input
                        type="text"
                        placeholder="Ex: Clio, Corolla..."
                        value={form.carModel}
                        onChange={(e) => update("carModel", e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Immatriculation</label>
                      <input
                        type="text"
                        placeholder="Ex: 123 TU 456"
                        value={form.carPlate}
                        onChange={(e) => update("carPlate", e.target.value.toUpperCase())}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Couleur</label>
                      <select
                        value={form.carColor}
                        onChange={(e) => update("carColor", e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="">Choisir...</option>
                        {CAR_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (facultatif)</label>
                  <textarea
                    rows={3}
                    placeholder="Informations complémentaires..."
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Récapitulatif</h2>
              <p className="text-slate-500 mb-6">Vérifiez votre réservation avant de confirmer</p>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Prestation</h3>
                  {selectedService && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ICONS[selectedService.icon] || "🚗"}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{selectedService.name}</p>
                        <p className="text-sm text-slate-500">{selectedService.duration} minutes</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-slate-900">{selectedService.price}</p>
                        <p className="text-xs text-slate-500">{settings?.currency || "TND"}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Date & Heure</h3>
                  <div className="flex items-center gap-2 text-slate-900">
                    <span>📅</span>
                    <span className="font-medium">
                      {form.date ? new Date(form.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
                    </span>
                    <span className="text-slate-400">à</span>
                    <span className="font-medium">{form.timeSlot}</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Client</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-slate-500">Nom:</span> <span className="font-medium">{form.customerName}</span></p>
                    <p><span className="text-slate-500">Téléphone:</span> <span className="font-medium">{form.customerPhone}</span></p>
                    {form.customerEmail && <p><span className="text-slate-500">Email:</span> <span className="font-medium">{form.customerEmail}</span></p>}
                  </div>
                </div>
                {(form.carBrand || form.carModel || form.carPlate || form.carColor) && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Véhicule</h3>
                    <div className="space-y-1 text-sm">
                      {(form.carBrand || form.carModel) && <p><span className="text-slate-500">Voiture:</span> <span className="font-medium">{[form.carBrand, form.carModel].filter(Boolean).join(" ")}</span></p>}
                      {form.carPlate && <p><span className="text-slate-500">Immatriculation:</span> <span className="font-medium">{form.carPlate}</span></p>}
                      {form.carColor && <p><span className="text-slate-500">Couleur:</span> <span className="font-medium">{form.carColor}</span></p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
            ) : (
              <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Accueil
              </Link>
            )}
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Continuer
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold px-8 py-2.5 rounded-xl transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    ✓ Confirmer la réservation
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <BookingForm />
    </Suspense>
  );
}
