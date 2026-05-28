import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const pw = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: { email: "admin@carwash.com", name: "Administrateur", password: pw, role: "ADMIN" },
    });
    console.log("  Admin créé: admin@carwash.com / admin123");
  }

  await prisma.stationSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: {
      id: "settings",
      name: "AutoSplash Station de Lavage",
      address: "123 Avenue de la Propreté, Tunis",
      phone: "+216 71 000 000",
      email: "contact@autosplash.tn",
      description: "Station de lavage automobile moderne offrant des services de qualité.",
      openingTime: "08:00",
      closingTime: "19:00",
      slotDuration: 30,
      maxCarsPerSlot: 3,
      workingDays: "1,2,3,4,5,6",
      currency: "TND",
    },
  });
  console.log("  Paramètres station OK");

  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    const services = [
      { name: "Lavage Extérieur", description: "Lavage complet de la carrosserie, jantes et vitres. Séchage inclus.", duration: 30, price: 15, category: "STANDARD", color: "#0ea5e9", icon: "droplets", sortOrder: 1 },
      { name: "Lavage Intérieur", description: "Aspirateur, nettoyage des sièges, tableau de bord et vitres intérieures.", duration: 45, price: 20, category: "STANDARD", color: "#06b6d4", icon: "spray-can", sortOrder: 2 },
      { name: "Lavage Complet", description: "Lavage intérieur et extérieur complet. Notre prestation la plus populaire.", duration: 60, price: 30, category: "PREMIUM", color: "#8b5cf6", icon: "car", sortOrder: 3 },
      { name: "Lavage Premium", description: "Lavage complet + cire de protection, traitement des plastiques, parfum d'habitacle.", duration: 90, price: 50, category: "PREMIUM", color: "#f59e0b", icon: "star", sortOrder: 4 },
      { name: "Nettoyage Moteur", description: "Dégraissage et nettoyage complet du compartiment moteur.", duration: 45, price: 35, category: "SPECIAL", color: "#ef4444", icon: "settings", sortOrder: 5 },
      { name: "Polissage Carrosserie", description: "Polissage professionnel pour retrouver l'éclat d'origine de votre véhicule.", duration: 120, price: 80, category: "SPECIAL", color: "#10b981", icon: "sparkles", sortOrder: 6 },
    ];
    await prisma.service.createMany({ data: services });
    console.log("  6 services créés");
  }

  console.log("Seed terminé.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
