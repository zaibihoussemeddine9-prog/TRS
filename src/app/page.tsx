import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStationData() {
  const settings = await prisma.stationSettings.findUnique({ where: { id: "settings" } }).catch(() => null);
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }).catch(() => []);
  return { settings, services };
}

const CATEGORY_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  SPECIAL: "Spécial",
};

const ICONS: Record<string, string> = {
  droplets: "💧",
  "spray-can": "🧹",
  car: "🚗",
  star: "⭐",
  settings: "⚙️",
  sparkles: "✨",
};

export default async function HomePage() {
  const { settings, services } = await getStationData();
  const stationName = settings?.name || "AutoSplash";

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">AS</div>
              <span className="font-bold text-slate-900 text-lg">{stationName}</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm text-slate-600 hover:text-sky-600 transition-colors">Nos Services</a>
              <a href="#how-it-works" className="text-sm text-slate-600 hover:text-sky-600 transition-colors">Comment ça marche</a>
              <a href="#contact" className="text-sm text-slate-600 hover:text-sky-600 transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/login" className="text-sm text-slate-500 hover:text-slate-700">Admin</Link>
              <Link
                href="/booking"
                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Réserver maintenant
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero pt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm text-sky-200 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                Station ouverte aujourd'hui
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Votre voiture mérite
                <span className="text-sky-300"> le meilleur</span>
                <br />lavage
              </h1>
              <p className="text-slate-300 text-lg mb-8 max-w-lg">
                Réservez votre créneau en ligne en moins de 2 minutes. Service rapide, professionnel et sans attente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/booking"
                  className="bg-sky-400 hover:bg-sky-300 text-white font-semibold px-8 py-4 rounded-xl text-center text-lg transition-colors shadow-lg"
                >
                  Prendre un RDV gratuit
                </Link>
                <a
                  href="#services"
                  className="border border-white/30 hover:bg-white/10 text-white font-medium px-8 py-4 rounded-xl text-center text-lg transition-colors"
                >
                  Voir nos services
                </a>
              </div>
              <div className="flex items-center gap-8 mt-12">
                <div>
                  <div className="text-3xl font-bold text-white">2 000+</div>
                  <div className="text-slate-400 text-sm">Voitures lavées</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div>
                  <div className="text-3xl font-bold text-white">98%</div>
                  <div className="text-slate-400 text-sm">Satisfaction client</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div>
                  <div className="text-3xl font-bold text-white">6</div>
                  <div className="text-slate-400 text-sm">Jours / semaine</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 bg-sky-400/20 rounded-full blur-3xl"></div>
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-9xl mb-4">🚗</div>
                    <div className="flex justify-center gap-2 text-4xl">
                      <span className="animate-bounce delay-0">💧</span>
                      <span className="animate-bounce delay-100">💧</span>
                      <span className="animate-bounce delay-200">💧</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Nos Formules de Lavage</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Choisissez la formule adaptée à vos besoins, du lavage express au traitement complet.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-2" style={{ backgroundColor: service.color }}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{ICONS[service.icon || "car"] || "🚗"}</div>
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                      {CATEGORY_LABELS[service.category] || service.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{service.name}</h3>
                  <p className="text-slate-500 text-sm mb-4 leading-relaxed">{service.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-2xl font-bold text-slate-900">{service.price} </span>
                      <span className="text-sm text-slate-500">{settings?.currency || "TND"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.duration} min
                    </div>
                  </div>
                  <Link
                    href={`/booking?service=${service.id}`}
                    className="mt-4 block w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors"
                    style={{ backgroundColor: service.color + "15", color: service.color }}
                  >
                    Réserver cette formule
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Comment ça marche ?</h2>
            <p className="text-slate-600 text-lg">Réserver un lavage n'a jamais été aussi simple</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: "📱", title: "Choisissez votre formule", desc: "Sélectionnez parmi nos formules de lavage la prestation qui correspond à vos besoins." },
              { step: "02", icon: "📅", title: "Choisissez votre créneau", desc: "Sélectionnez la date et l'heure qui vous conviennent parmi les créneaux disponibles." },
              { step: "03", icon: "✅", title: "Confirmez votre RDV", desc: "Renseignez vos coordonnées et recevez votre confirmation de réservation immédiatement." },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="relative inline-flex">
                  <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:bg-sky-100 transition-colors">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-sky-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
            >
              Réserver maintenant
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-4 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Nous contacter</h2>
              <div className="space-y-4">
                {settings?.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">📍</div>
                    <div>
                      <div className="font-medium">Adresse</div>
                      <div className="text-slate-400">{settings.address}</div>
                    </div>
                  </div>
                )}
                {settings?.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">📞</div>
                    <div>
                      <div className="font-medium">Téléphone</div>
                      <div className="text-slate-400">{settings.phone}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">🕒</div>
                  <div>
                    <div className="font-medium">Horaires</div>
                    <div className="text-slate-400">
                      Lun - Sam: {settings?.openingTime || "08:00"} - {settings?.closingTime || "19:00"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6">Réservation rapide</h3>
              <p className="text-slate-400 mb-6">Prenez rendez-vous en ligne et évitez l'attente. C'est gratuit et immédiat.</p>
              <Link
                href="/booking"
                className="block w-full text-center bg-sky-500 hover:bg-sky-400 text-white font-semibold px-6 py-4 rounded-xl transition-colors"
              >
                Réserver un créneau
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center text-white font-bold text-xs">AS</div>
            <span className="text-sm">{stationName}</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} {stationName}. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
