import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTok Shop DZ - Boutique en ligne Algérie",
  description: "Les meilleures tendances TikTok, livrées partout en Algérie. Paiement à la livraison.",
  keywords: "boutique en ligne, algérie, tiktok, mode, beauté, livraison",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Cairo:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 font-sans">{children}</body>
    </html>
  );
}
