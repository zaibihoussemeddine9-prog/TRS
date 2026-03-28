import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  await prisma.productionDeclaration.deleteMany();
  await prisma.downtimeEvent.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.productLine.deleteMany();
  await prisma.downtimeSubCategory.deleteMany();
  await prisma.downtimeCategory.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.product.deleteMany();
  await prisma.line.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: { email: "admin@pharma.com", name: "Admin", password: pw, role: "ADMIN" },
  });

  const line = await prisma.line.create({
    data: { name: "Ligne 1", code: "L1", lineType: "blistereuse" },
  });

  const [prodA, prodB, prodC] = await Promise.all([
    prisma.product.create({ data: { name: "Produit A", code: "PROD-A", family: "Antibiotiques", form: "Comprimé", dosage: "500mg", nominalSpeed: 120, targetOEE: 0.85, unitsPerPack: 30 } }),
    prisma.product.create({ data: { name: "Produit B", code: "PROD-B", family: "Antalgiques", form: "Gélule", dosage: "1000mg", nominalSpeed: 150, targetOEE: 0.88, unitsPerPack: 20 } }),
    prisma.product.create({ data: { name: "Produit C", code: "PROD-C", family: "Sirops", form: "Sirop", dosage: "150ml", nominalSpeed: 60, targetOEE: 0.78, unitsPerPack: 1 } }),
  ]);

  // Product-Line compatibility
  await prisma.productLine.createMany({
    data: [
      { productId: prodA.id, lineId: line.id },
      { productId: prodB.id, lineId: line.id },
      { productId: prodC.id, lineId: line.id },
    ],
  });

  // Shifts
  await prisma.shift.createMany({
    data: [
      { name: "Matin", code: "SH-M", startTime: "06:00", endTime: "14:00" },
      { name: "Après-midi", code: "SH-A", startTime: "14:00", endTime: "22:00" },
      { name: "Nuit", code: "SH-N", startTime: "22:00", endTime: "06:00" },
      { name: "Journée", code: "SH-J", startTime: "08:00", endTime: "17:00" },
    ],
  });

  // Downtime hierarchy
  const catTech = await prisma.downtimeCategory.create({ data: { name: "Technique", code: "TECH", color: "#ef4444", sortOrder: 1 } });
  const catOrga = await prisma.downtimeCategory.create({ data: { name: "Organisationnel", code: "ORGA", color: "#f59e0b", sortOrder: 2 } });
  const catQual = await prisma.downtimeCategory.create({ data: { name: "Qualité", code: "QUAL", color: "#8b5cf6", sortOrder: 3 } });

  await prisma.downtimeSubCategory.createMany({
    data: [
      { name: "Panne mécanique", code: "TECH-MECA", categoryId: catTech.id, sortOrder: 1 },
      { name: "Panne électrique", code: "TECH-ELEC", categoryId: catTech.id, sortOrder: 2 },
      { name: "Changement", code: "ORGA-CHG", categoryId: catOrga.id, sortOrder: 1 },
      { name: "Attente", code: "ORGA-ATT", categoryId: catOrga.id, sortOrder: 2 },
      { name: "Contrôle qualité", code: "QUAL-CTRL", categoryId: catQual.id, sortOrder: 1 },
    ],
  });

  console.log("Seed OK — admin@pharma.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
