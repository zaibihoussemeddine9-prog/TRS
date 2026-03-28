import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean all tables in FK-safe order
  await prisma.auditLog.deleteMany();
  await prisma.actionPlan.deleteMany();
  await prisma.downtimeEntry.deleteMany();
  await prisma.productionEntry.deleteMany();
  await prisma.kPIThreshold.deleteMany();
  await prisma.downtimeSubCause.deleteMany();
  await prisma.downtimeCause.deleteMany();
  await prisma.productLineConfig.deleteMany();
  await prisma.format.deleteMany();
  await prisma.product.deleteMany();
  await prisma.team.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.packagingLine.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();

  // 1 admin user
  const password = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: { email: "admin@pharma.com", name: "Admin", password, role: "ADMIN" },
  });

  // 1 site → 1 atelier → 1 ligne
  const site = await prisma.site.create({
    data: { name: "Site Principal", code: "S1" },
  });
  const workshop = await prisma.workshop.create({
    data: { name: "Atelier Conditionnement", code: "AT1", siteId: site.id },
  });
  const line = await prisma.packagingLine.create({
    data: { name: "Ligne 1", code: "L1", workshopId: workshop.id, lineType: "blistereuse" },
  });

  // 3 produits
  const prodA = await prisma.product.create({
    data: { name: "Produit A", code: "PROD-A" },
  });
  const prodB = await prisma.product.create({
    data: { name: "Produit B", code: "PROD-B" },
  });
  const prodC = await prisma.product.create({
    data: { name: "Produit C", code: "PROD-C" },
  });

  // 1 format par produit
  await prisma.format.create({
    data: { name: "Format A", code: "FMT-A", productId: prodA.id, unitsPerPack: 30 },
  });
  await prisma.format.create({
    data: { name: "Format B", code: "FMT-B", productId: prodB.id, unitsPerPack: 20 },
  });
  await prisma.format.create({
    data: { name: "Format C", code: "FMT-C", productId: prodC.id, unitsPerPack: 14 },
  });

  // 1 shift minimum (requis par le formulaire de saisie production)
  await prisma.shift.create({
    data: { name: "Matin", code: "SH-M", startTime: "06:00", endTime: "14:00" },
  });

  // 1 cause d'arrêt minimum (requis par le formulaire arrêts)
  await prisma.downtimeCause.create({
    data: { name: "Panne mécanique", code: "PM", type: "UNPLANNED", responsibility: "MAINTENANCE" },
  });

  console.log("Seed OK — 1 ligne, 3 produits, 1 user (admin@pharma.com / admin123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
