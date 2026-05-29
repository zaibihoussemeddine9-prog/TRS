export function TrendingBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1a0a] via-[#0f1a10] to-[#0a0a1a] border border-[#ff2d55]/20 p-6 sm:p-10 mb-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,45,85,0.12),_transparent_60%)]" />
      <div className="absolute top-4 right-6 text-6xl opacity-10 select-none">🐾</div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🇩🇿</span>
          <span className="bg-[#ff2d55]/20 text-[#ff2d55] text-xs font-bold px-3 py-1 rounded-full border border-[#ff2d55]/30">
            LIVRAISON DANS LES 48 WILAYAS
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
          Tout pour vos <span className="text-[#ff2d55]">🐱 Chats</span> &amp;{" "}
          <span className="text-[#ff2d55]">🐶 Chiens</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-lg">
          Nourriture premium, jouets, accessoires et soins livrés chez vous.
          Paiement à la livraison dans toute l&apos;Algérie.
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          <div className="flex items-center gap-1.5 text-sm text-gray-300">
            <span className="text-[#ff2d55]">✓</span> Paiement à la livraison
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-300">
            <span className="text-[#ff2d55]">✓</span> Livraison 48-72h
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-300">
            <span className="text-[#ff2d55]">✓</span> Produits vétérinaires approuvés
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <span className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 px-3 py-1.5 rounded-full">🐱 Chats</span>
          <span className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 px-3 py-1.5 rounded-full">🐶 Chiens</span>
          <span className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 px-3 py-1.5 rounded-full">🎾 Jouets</span>
          <span className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 px-3 py-1.5 rounded-full">🍖 Nourriture</span>
        </div>
      </div>
    </section>
  )
}
