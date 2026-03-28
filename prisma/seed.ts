import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // ===== USER: create admin only if no users exist =====
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const pw = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: { email: "admin@pharma.com", name: "Admin", password: pw, role: "ADMIN" },
    });
    console.log("  Admin créé");
  }

  // ===== LINE: create if none exist =====
  const lineCount = await prisma.line.count();
  if (lineCount === 0) {
    await prisma.line.create({
      data: { name: "Ligne 1", code: "L1", lineType: "blistereuse" },
    });
    console.log("  Ligne 1 créée");
  }

  // ===== PRODUCTS: create if none exist =====
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const line = await prisma.line.findFirst();
    const [prodA, prodB, prodC] = await Promise.all([
      prisma.product.create({ data: { name: "Produit A", code: "PROD-A", family: "Antibiotiques", form: "Comprimé", dosage: "500mg", nominalSpeed: 120, targetOEE: 0.85, unitsPerPack: 30 } }),
      prisma.product.create({ data: { name: "Produit B", code: "PROD-B", family: "Antalgiques", form: "Gélule", dosage: "1000mg", nominalSpeed: 150, targetOEE: 0.88, unitsPerPack: 20 } }),
      prisma.product.create({ data: { name: "Produit C", code: "PROD-C", family: "Sirops", form: "Sirop", dosage: "150ml", nominalSpeed: 60, targetOEE: 0.78, unitsPerPack: 1 } }),
    ]);
    if (line) {
      await prisma.productLine.createMany({
        data: [
          { productId: prodA.id, lineId: line.id },
          { productId: prodB.id, lineId: line.id },
          { productId: prodC.id, lineId: line.id },
        ],
      });
    }
    console.log("  3 produits créés");
  }

  // ===== SHIFTS: upsert (always ensure all 4 exist) =====
  const shiftData = [
    { name: "Matin", code: "SH-M", startTime: "06:00", endTime: "14:00" },
    { name: "Après-midi", code: "SH-A", startTime: "14:00", endTime: "22:00" },
    { name: "Nuit", code: "SH-N", startTime: "22:00", endTime: "06:00" },
    { name: "Journée", code: "SH-J", startTime: "08:00", endTime: "17:00" },
  ];
  for (const s of shiftData) {
    await prisma.shift.upsert({
      where: { code: s.code },
      update: { name: s.name, startTime: s.startTime, endTime: s.endTime },
      create: s,
    });
  }
  console.log("  4 shifts OK");

  // ===== DOWNTIME CATEGORIES: upsert =====
  const categories = [
    { name: "Technique", code: "TECH", color: "#ef4444", sortOrder: 1 },
    { name: "Organisationnel", code: "ORGA", color: "#f59e0b", sortOrder: 2 },
    { name: "Qualité", code: "QUAL", color: "#8b5cf6", sortOrder: 3 },
  ];
  for (const c of categories) {
    await prisma.downtimeCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, color: c.color, sortOrder: c.sortOrder },
      create: c,
    });
  }

  const catTech = await prisma.downtimeCategory.findUnique({ where: { code: "TECH" } });
  const catOrga = await prisma.downtimeCategory.findUnique({ where: { code: "ORGA" } });
  const catQual = await prisma.downtimeCategory.findUnique({ where: { code: "QUAL" } });

  const subCategories = [
    { name: "Panne mécanique", code: "TECH-MECA", categoryId: catTech!.id, sortOrder: 1 },
    { name: "Panne électrique", code: "TECH-ELEC", categoryId: catTech!.id, sortOrder: 2 },
    { name: "Changement", code: "ORGA-CHG", categoryId: catOrga!.id, sortOrder: 1 },
    { name: "Attente", code: "ORGA-ATT", categoryId: catOrga!.id, sortOrder: 2 },
    { name: "Contrôle qualité", code: "QUAL-CTRL", categoryId: catQual!.id, sortOrder: 1 },
  ];
  for (const s of subCategories) {
    await prisma.downtimeSubCategory.upsert({
      where: { code: s.code },
      update: { name: s.name, categoryId: s.categoryId, sortOrder: s.sortOrder },
      create: s,
    });
  }
  console.log("  3 catégories + 5 sous-catégories OK");

  console.log("Seed terminé — admin@pharma.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
