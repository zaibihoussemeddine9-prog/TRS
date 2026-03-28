import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Clean in FK-safe order
  await prisma.shiftProduction.deleteMany();
  await prisma.downtimeEvent.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.downtimeType.deleteMany();
  await prisma.downtimeSubCategory.deleteMany();
  await prisma.downtimeCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.line.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // User
  const pw = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: { email: "admin@pharma.com", name: "Admin", password: pw, role: "ADMIN" },
  });

  // Line
  await prisma.line.create({
    data: { name: "Ligne 1", code: "L1", lineType: "blistereuse" },
  });

  // Products
  await prisma.product.createMany({
    data: [
      { name: "Produit A", code: "PROD-A", family: "Antibiotiques", form: "Comprimé", dosage: "500mg", nominalSpeed: 120, targetOEE: 0.85, unitsPerPack: 30 },
      { name: "Produit B", code: "PROD-B", family: "Antalgiques", form: "Gélule", dosage: "1000mg", nominalSpeed: 150, targetOEE: 0.88, unitsPerPack: 20 },
      { name: "Produit C", code: "PROD-C", family: "Sirops", form: "Sirop", dosage: "150ml", nominalSpeed: 60, targetOEE: 0.78, unitsPerPack: 1 },
    ],
  });

  // Downtime hierarchy
  const catTech = await prisma.downtimeCategory.create({
    data: { name: "Technique", code: "TECH", color: "#ef4444", sortOrder: 1 },
  });
  const catOrga = await prisma.downtimeCategory.create({
    data: { name: "Organisationnel", code: "ORGA", color: "#f59e0b", sortOrder: 2 },
  });
  const catQual = await prisma.downtimeCategory.create({
    data: { name: "Qualité", code: "QUAL", color: "#8b5cf6", sortOrder: 3 },
  });

  const subPanneMeca = await prisma.downtimeSubCategory.create({
    data: { name: "Panne mécanique", code: "TECH-MECA", categoryId: catTech.id, sortOrder: 1 },
  });
  const subPanneElec = await prisma.downtimeSubCategory.create({
    data: { name: "Panne électrique", code: "TECH-ELEC", categoryId: catTech.id, sortOrder: 2 },
  });
  const subChangement = await prisma.downtimeSubCategory.create({
    data: { name: "Changement", code: "ORGA-CHG", categoryId: catOrga.id, sortOrder: 1 },
  });
  const subAttente = await prisma.downtimeSubCategory.create({
    data: { name: "Attente", code: "ORGA-ATT", categoryId: catOrga.id, sortOrder: 2 },
  });
  const subControle = await prisma.downtimeSubCategory.create({
    data: { name: "Contrôle qualité", code: "QUAL-CTRL", categoryId: catQual.id, sortOrder: 1 },
  });

  await prisma.downtimeType.createMany({
    data: [
      { name: "Changement de courroie", code: "TECH-MECA-01", subCategoryId: subPanneMeca.id, sortOrder: 1 },
      { name: "Bourrage machine", code: "TECH-MECA-02", subCategoryId: subPanneMeca.id, sortOrder: 2 },
      { name: "Roulement usé", code: "TECH-MECA-03", subCategoryId: subPanneMeca.id, sortOrder: 3 },
      { name: "Capteur défaillant", code: "TECH-ELEC-01", subCategoryId: subPanneElec.id, sortOrder: 1 },
      { name: "Automate en défaut", code: "TECH-ELEC-02", subCategoryId: subPanneElec.id, sortOrder: 2 },
      { name: "Changement de format", code: "ORGA-CHG-01", subCategoryId: subChangement.id, sortOrder: 1 },
      { name: "Changement de lot", code: "ORGA-CHG-02", subCategoryId: subChangement.id, sortOrder: 2 },
      { name: "Attente matières", code: "ORGA-ATT-01", subCategoryId: subAttente.id, sortOrder: 1 },
      { name: "Attente maintenance", code: "ORGA-ATT-02", subCategoryId: subAttente.id, sortOrder: 2 },
      { name: "Contrôle en cours", code: "QUAL-CTRL-01", subCategoryId: subControle.id, sortOrder: 1 },
      { name: "Défaut d'aspect", code: "QUAL-CTRL-02", subCategoryId: subControle.id, sortOrder: 2 },
    ],
  });

  console.log("Seed OK — admin@pharma.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
