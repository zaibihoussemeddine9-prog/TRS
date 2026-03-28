import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  await prisma.downtime.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.downtimeType.deleteMany();
  await prisma.product.deleteMany();
  await prisma.line.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: { email: "admin@pharma.com", name: "Admin", password: pw, role: "ADMIN" },
  });

  await prisma.line.create({
    data: { name: "Ligne 1", code: "L1", lineType: "blistereuse" },
  });

  await prisma.product.createMany({
    data: [
      { name: "Produit A", code: "PROD-A", family: "Antibiotiques", form: "Comprimé", dosage: "500mg", nominalSpeed: 120, targetOEE: 0.85, unitsPerPack: 30 },
      { name: "Produit B", code: "PROD-B", family: "Antalgiques", form: "Gélule", dosage: "1000mg", nominalSpeed: 150, targetOEE: 0.88, unitsPerPack: 20 },
      { name: "Produit C", code: "PROD-C", family: "Sirops", form: "Sirop", dosage: "150ml", nominalSpeed: 60, targetOEE: 0.78, unitsPerPack: 1 },
    ],
  });

  await prisma.downtimeType.createMany({
    data: [
      { name: "Panne mécanique", code: "PM", category: "Maintenance" },
      { name: "Panne électrique", code: "PE", category: "Maintenance" },
      { name: "Changement de format", code: "CF", category: "Production" },
      { name: "Nettoyage", code: "NET", category: "Production" },
      { name: "Attente matières", code: "AM", category: "Logistique" },
      { name: "Défaut qualité", code: "DQ", category: "Qualité" },
      { name: "Réglage machine", code: "RM", category: "Production" },
      { name: "Micro-arrêt", code: "MA", category: "Production" },
    ],
  });

  console.log("Seed OK — admin@pharma.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
