export function TrendingBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1a0a12] via-[#200a18] to-[#0a0a1a] border border-[#ff2d55]/20 p-6 sm:p-10 mb-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,45,85,0.15),_transparent_60%)]" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🇩🇿</span>
          <span className="bg-[#ff2d55]/20 text-[#ff2d55] text-xs font-bold px-3 py-1 rounded-full border border-[#ff2d55]/30">
            LIVRAISON DANS LES 48 WILAYAS
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
          Les produits <span className="text-[#ff2d55]">TikTok</span> trending
          <br className="hidden sm:block" /> livrés chez vous
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-lg">
          Commandez les articles viraux de TikTok. Paiement à la livraison. Livraison express dans toute l&apos;Algérie.
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          <div className="flex items-center gap-1.5 text-sm text-gray-300">
            <span className="text-[#ff2d55]">✓</span> Paiement à la livraison
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-300">
            <span className="text-[#ff2d55]">✓</span> Livraison 48-72h
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-300">
            <span className="text-[#ff2d55]">✓</span> Retour facile
          </div>
        </div>
      </div>
    </section>
  )
}
