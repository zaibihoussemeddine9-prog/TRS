import { CartProvider } from "@/components/store/CartProvider";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import CartDrawer from "@/components/store/CartDrawer";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import { prisma } from "@/lib/prisma";

async function getSettings() {
  const settings = await prisma.siteSetting.findMany();
  return Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value]));
}

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <CartProvider>
      <StoreHeader siteName={settings.siteName} />
      <CartDrawer />
      <main className="min-h-screen">{children}</main>
      <StoreFooter siteName={settings.siteName} whatsapp={settings.whatsapp} tiktokUrl={settings.tiktokUrl} />
      <WhatsAppButton phone={settings.whatsapp || "213555000000"} />
    </CartProvider>
  );
}
