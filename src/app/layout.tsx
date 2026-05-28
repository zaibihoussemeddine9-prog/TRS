import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ScootDZ - Location de Trottinettes",
  description: "Louez une trottinette électrique à Alger en quelques secondes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ScootDZ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-slate-900 text-white antialiased font-sans overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
