import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPw = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { email: "admin@tiktokshop.dz" },
    update: {},
    create: { email: "admin@tiktokshop.dz", password: hashedPw, name: "Admin" },
  });

  const cats = [
    { name: "Mode & Vêtements", nameAr: "الموضة والملابس", slug: "mode-vetements", sortOrder: 1 },
    { name: "Beauté & Cosmétiques", nameAr: "الجمال ومستحضرات التجميل", slug: "beaute-cosmetiques", sortOrder: 2 },
    { name: "Électronique", nameAr: "الإلكترونيات", slug: "electronique", sortOrder: 3 },
    { name: "Maison & Déco", nameAr: "المنزل والديكور", slug: "maison-deco", sortOrder: 4 },
    { name: "Sport & Fitness", nameAr: "الرياضة واللياقة", slug: "sport-fitness", sortOrder: 5 },
    { name: "Enfants", nameAr: "الأطفال", slug: "enfants", sortOrder: 6 },
  ];

  for (const cat of cats) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const beauteId = (await prisma.category.findUnique({ where: { slug: "beaute-cosmetiques" } }))!.id;
  const modeId = (await prisma.category.findUnique({ where: { slug: "mode-vetements" } }))!.id;
  const electroId = (await prisma.category.findUnique({ where: { slug: "electronique" } }))!.id;

  const products = [
    {
      name: "Sérum Vitamine C Éclat",
      nameAr: "سيروم فيتامين سي المشرق",
      slug: "serum-vitamine-c-eclat",
      description: "Sérum anti-taches à la vitamine C pour un teint lumineux. Formule légère, absorption rapide. Résultats visibles en 2 semaines.",
      price: 1800,
      comparePrice: 2500,
      images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"],
      stock: 50,
      categoryId: beauteId,
      tags: ["serum", "vitamine-c", "eclat"],
      featured: true,
      sold: 234,
    },
    {
      name: "Huile de Rose Musquée Bio",
      nameAr: "زيت الورد المسك العضوي",
      slug: "huile-rose-musquee-bio",
      description: "Huile 100% naturelle pour hydrater et régénérer la peau. Riche en oméga-3 et vitamine E.",
      price: 1200,
      comparePrice: 1800,
      images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600"],
      stock: 80,
      categoryId: beauteId,
      tags: ["huile", "bio", "naturel"],
      featured: true,
      sold: 189,
    },
    {
      name: "Robe Abaya Moderne",
      nameAr: "عباءة عصرية",
      slug: "robe-abaya-moderne",
      description: "Abaya élégante en tissu fluide, disponible en plusieurs couleurs. Coupe moderne et confortable.",
      price: 3500,
      comparePrice: 5000,
      images: ["https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600"],
      stock: 30,
      categoryId: modeId,
      tags: ["abaya", "robe", "mode"],
      featured: true,
      sold: 156,
    },
    {
      name: "Écouteurs Bluetooth Pro",
      nameAr: "سماعات بلوتوث احترافية",
      slug: "ecouteurs-bluetooth-pro",
      description: "Écouteurs sans fil avec réduction de bruit active, autonomie 30h, charge rapide en 15min.",
      price: 4500,
      comparePrice: 7000,
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
      stock: 25,
      categoryId: electroId,
      tags: ["ecouteurs", "bluetooth", "audio"],
      featured: true,
      sold: 98,
    },
    {
      name: "Crème Hydratante Argan",
      nameAr: "كريم مرطب بزيت الأرغان",
      slug: "creme-hydratante-argan",
      description: "Crème visage à l'huile d'argan marocaine. Nourrit et protège la peau toute la journée.",
      price: 950,
      comparePrice: 1400,
      images: ["https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=600"],
      stock: 100,
      categoryId: beauteId,
      tags: ["creme", "argan", "visage"],
      featured: false,
      sold: 312,
    },
    {
      name: "Montre Connectée Sport",
      nameAr: "ساعة ذكية رياضية",
      slug: "montre-connectee-sport",
      description: "Smartwatch avec suivi de fréquence cardiaque, GPS, étanche IP68. Compatible Android et iOS.",
      price: 6800,
      comparePrice: 10000,
      images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"],
      stock: 20,
      categoryId: electroId,
      tags: ["montre", "smartwatch", "sport"],
      featured: false,
      sold: 67,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  const settings = [
    { key: "siteName", value: "TikTok Shop DZ" },
    { key: "whatsapp", value: "213555000000" },
    { key: "phone", value: "+213 555 00 00 00" },
    { key: "email", value: "contact@tiktokshop.dz" },
    { key: "address", value: "Alger, Algérie" },
    { key: "shippingFee", value: "400" },
    { key: "freeShippingThreshold", value: "5000" },
    { key: "tiktokUrl", value: "https://www.tiktok.com/@tiktokshop.dz" },
    { key: "instagramUrl", value: "" },
    { key: "facebookUrl", value: "" },
    { key: "bannerTitle", value: "Les Meilleures Tendances TikTok" },
    { key: "bannerSubtitle", value: "Livraison dans toute l'Algérie • Paiement à la livraison" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log("✅ Seed terminé!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
