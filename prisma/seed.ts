import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
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

  // ========================
  // USERS
  // ========================
  const password = await bcrypt.hash("admin123", 12);
  const users = await Promise.all([
    prisma.user.create({ data: { email: "admin@pharma.com", name: "Admin Système", password, role: "ADMIN" } }),
    prisma.user.create({ data: { email: "direction@pharma.com", name: "M. Directeur", password, role: "DIRECTION" } }),
    prisma.user.create({ data: { email: "prod@pharma.com", name: "Chef Production", password, role: "RESP_PRODUCTION" } }),
    prisma.user.create({ data: { email: "maint@pharma.com", name: "Chef Maintenance", password, role: "RESP_MAINTENANCE" } }),
    prisma.user.create({ data: { email: "qualite@pharma.com", name: "Resp. Qualité", password, role: "RESP_QUALITE" } }),
    prisma.user.create({ data: { email: "superviseur@pharma.com", name: "Superviseur A", password, role: "SUPERVISEUR" } }),
    prisma.user.create({ data: { email: "lecture@pharma.com", name: "Observateur", password, role: "LECTURE_SEULE" } }),
  ]);
  const [admin, director, prodChef, maintChef, qualChef, supervisor] = users;

  // ========================
  // SITE & WORKSHOPS
  // ========================
  const site = await prisma.site.create({
    data: { name: "Site Pharma Casablanca", code: "CAS01", address: "Zone Industrielle, Casablanca" },
  });

  const atelierCondit = await prisma.workshop.create({
    data: { name: "Atelier Conditionnement Primaire", code: "ACP01", siteId: site.id },
  });
  const atelierSecond = await prisma.workshop.create({
    data: { name: "Atelier Conditionnement Secondaire", code: "ACS01", siteId: site.id },
  });

  // ========================
  // LINES
  // ========================
  const lines = await Promise.all([
    prisma.packagingLine.create({ data: { name: "Ligne Blistéreuse 1", code: "BL01", workshopId: atelierCondit.id, lineType: "blistereuse" } }),
    prisma.packagingLine.create({ data: { name: "Ligne Blistéreuse 2", code: "BL02", workshopId: atelierCondit.id, lineType: "blistereuse" } }),
    prisma.packagingLine.create({ data: { name: "Ligne Encartonneuse 1", code: "EN01", workshopId: atelierSecond.id, lineType: "encartonneuse" } }),
    prisma.packagingLine.create({ data: { name: "Ligne Encartonneuse 2", code: "EN02", workshopId: atelierSecond.id, lineType: "encartonneuse" } }),
    prisma.packagingLine.create({ data: { name: "Ligne Sirop", code: "SIR01", workshopId: atelierCondit.id, lineType: "remplisseuse_sirop" } }),
    prisma.packagingLine.create({ data: { name: "Ligne Tube", code: "TUB01", workshopId: atelierCondit.id, lineType: "remplisseuse_tube" } }),
  ]);

  // ========================
  // SHIFTS & TEAMS
  // ========================
  const shifts = await Promise.all([
    prisma.shift.create({ data: { name: "Matin", code: "SH-M", startTime: "06:00", endTime: "14:00" } }),
    prisma.shift.create({ data: { name: "Après-midi", code: "SH-A", startTime: "14:00", endTime: "22:00" } }),
    prisma.shift.create({ data: { name: "Nuit", code: "SH-N", startTime: "22:00", endTime: "06:00" } }),
  ]);

  const teams = await Promise.all([
    prisma.team.create({ data: { name: "Équipe Alpha", code: "EQ-A" } }),
    prisma.team.create({ data: { name: "Équipe Bravo", code: "EQ-B" } }),
    prisma.team.create({ data: { name: "Équipe Charlie", code: "EQ-C" } }),
    prisma.team.create({ data: { name: "Équipe Delta", code: "EQ-D" } }),
  ]);

  // ========================
  // PRODUCTS & FORMATS
  // ========================
  const products = await Promise.all([
    prisma.product.create({ data: { name: "Amoxicilline 500mg", code: "AMX500", family: "Antibiotiques", form: "Gélule", dosage: "500mg", primaryPackaging: "Blister ALU/PVC", secondaryPackaging: "Étui carton", standardLotSize: 100000, targetYield: 0.98, targetRejectRate: 0.015, targetOEE: 0.85, qualityConstraints: "Stockage < 25°C, à l'abri de l'humidité" } }),
    prisma.product.create({ data: { name: "Paracétamol 1000mg", code: "PAR1000", family: "Antalgiques", form: "Comprimé", dosage: "1000mg", primaryPackaging: "Blister ALU/ALU", secondaryPackaging: "Étui carton", standardLotSize: 200000, targetYield: 0.99, targetRejectRate: 0.01, targetOEE: 0.88 } }),
    prisma.product.create({ data: { name: "Oméprazole 20mg", code: "OME20", family: "Gastro", form: "Gélule", dosage: "20mg", primaryPackaging: "Blister ALU/PVC", secondaryPackaging: "Étui carton", standardLotSize: 80000, targetYield: 0.97, targetRejectRate: 0.02, targetOEE: 0.82 } }),
    prisma.product.create({ data: { name: "Ibuprofène 400mg", code: "IBU400", family: "Anti-inflammatoires", form: "Comprimé", dosage: "400mg", primaryPackaging: "Blister PVC/PVDC", secondaryPackaging: "Étui carton", standardLotSize: 150000, targetYield: 0.98, targetRejectRate: 0.012, targetOEE: 0.85 } }),
    prisma.product.create({ data: { name: "Sirop Toux Adulte 150ml", code: "STA150", family: "Sirops", form: "Sirop", dosage: "150ml", primaryPackaging: "Flacon PET", secondaryPackaging: "Étui carton", standardLotSize: 50000, targetYield: 0.96, targetRejectRate: 0.025, targetOEE: 0.78 } }),
  ]);

  const formats = await Promise.all([
    prisma.format.create({ data: { name: "Blister 10 gél.", code: "BL10", productId: products[0].id, unitsPerBlister: 10, blistersPerBox: 3, boxesPerCarton: 12, cartonsPerPallet: 48, unitsPerPack: 30 } }),
    prisma.format.create({ data: { name: "Blister 20 gél.", code: "BL20", productId: products[0].id, unitsPerBlister: 10, blistersPerBox: 2, boxesPerCarton: 12, cartonsPerPallet: 48, unitsPerPack: 20 } }),
    prisma.format.create({ data: { name: "Boîte 30 cp", code: "BT30", productId: products[1].id, unitsPerBlister: 10, blistersPerBox: 3, boxesPerCarton: 10, cartonsPerPallet: 60, unitsPerPack: 30 } }),
    prisma.format.create({ data: { name: "Boîte 16 cp", code: "BT16", productId: products[1].id, unitsPerBlister: 8, blistersPerBox: 2, boxesPerCarton: 15, cartonsPerPallet: 60, unitsPerPack: 16 } }),
    prisma.format.create({ data: { name: "Gélule 14", code: "GEL14", productId: products[2].id, unitsPerBlister: 7, blistersPerBox: 2, boxesPerCarton: 12, cartonsPerPallet: 48, unitsPerPack: 14 } }),
    prisma.format.create({ data: { name: "Boîte 20 cp", code: "BT20-IBU", productId: products[3].id, unitsPerBlister: 10, blistersPerBox: 2, boxesPerCarton: 12, cartonsPerPallet: 48, unitsPerPack: 20 } }),
    prisma.format.create({ data: { name: "Flacon 150ml", code: "FL150", productId: products[4].id, unitsPerPack: 1, boxesPerCarton: 24, cartonsPerPallet: 36 } }),
  ]);

  // Product-Line configurations (cadences and times per product/line pair)
  await Promise.all([
    prisma.productLineConfig.create({ data: { productId: products[0].id, lineId: lines[0].id, nominalSpeed: 120, standardSpeed: 110, startupTime: 15, lineEmptyingTime: 10, formatChangeTime: 30, lotChangeTime: 15, cleaningTime: 20, adjustmentTime: 10, targetOEE: 0.85 } }),
    prisma.productLineConfig.create({ data: { productId: products[0].id, lineId: lines[1].id, nominalSpeed: 150, standardSpeed: 140, startupTime: 12, lineEmptyingTime: 8, formatChangeTime: 25, lotChangeTime: 12, cleaningTime: 15, adjustmentTime: 8, targetOEE: 0.88 } }),
    prisma.productLineConfig.create({ data: { productId: products[1].id, lineId: lines[0].id, nominalSpeed: 150, standardSpeed: 140, startupTime: 10, lineEmptyingTime: 8, formatChangeTime: 25, lotChangeTime: 10, cleaningTime: 15, adjustmentTime: 8, targetOEE: 0.88 } }),
    prisma.productLineConfig.create({ data: { productId: products[1].id, lineId: lines[1].id, nominalSpeed: 160, standardSpeed: 150, startupTime: 10, lineEmptyingTime: 8, formatChangeTime: 20, lotChangeTime: 10, cleaningTime: 12, adjustmentTime: 5, targetOEE: 0.90 } }),
    prisma.productLineConfig.create({ data: { productId: products[2].id, lineId: lines[0].id, nominalSpeed: 130, standardSpeed: 120, startupTime: 15, lineEmptyingTime: 12, formatChangeTime: 35, lotChangeTime: 15, cleaningTime: 25, adjustmentTime: 10, targetOEE: 0.82 } }),
    prisma.productLineConfig.create({ data: { productId: products[3].id, lineId: lines[1].id, nominalSpeed: 140, standardSpeed: 130, startupTime: 12, lineEmptyingTime: 10, formatChangeTime: 25, lotChangeTime: 12, cleaningTime: 18, adjustmentTime: 8, targetOEE: 0.85 } }),
    prisma.productLineConfig.create({ data: { productId: products[4].id, lineId: lines[4].id, nominalSpeed: 60, standardSpeed: 55, startupTime: 20, lineEmptyingTime: 15, formatChangeTime: 45, lotChangeTime: 20, cleaningTime: 40, adjustmentTime: 15, targetOEE: 0.78, comments: "Ligne spécifique sirops — nettoyage long" } }),
  ]);

  // ========================
  // DOWNTIME CAUSES & SUBCAUSES
  // ========================
  const causes = await Promise.all([
    prisma.downtimeCause.create({ data: { name: "Panne mécanique", code: "PM", type: "UNPLANNED", responsibility: "MAINTENANCE" } }),
    prisma.downtimeCause.create({ data: { name: "Panne électrique", code: "PE", type: "UNPLANNED", responsibility: "MAINTENANCE" } }),
    prisma.downtimeCause.create({ data: { name: "Changement de format", code: "CF", type: "PLANNED", responsibility: "PRODUCTION" } }),
    prisma.downtimeCause.create({ data: { name: "Nettoyage", code: "NET", type: "PLANNED", responsibility: "PRODUCTION" } }),
    prisma.downtimeCause.create({ data: { name: "Attente matières", code: "AM", type: "UNPLANNED", responsibility: "LOGISTIQUE" } }),
    prisma.downtimeCause.create({ data: { name: "Défaut qualité", code: "DQ", type: "UNPLANNED", responsibility: "QUALITE" } }),
    prisma.downtimeCause.create({ data: { name: "Réglage machine", code: "RM", type: "PLANNED", responsibility: "PRODUCTION" } }),
    prisma.downtimeCause.create({ data: { name: "Attente vide de ligne", code: "VDL", type: "PLANNED", responsibility: "QUALITE" } }),
    prisma.downtimeCause.create({ data: { name: "Micro-arrêt", code: "MA", type: "UNPLANNED", responsibility: "PRODUCTION" } }),
    prisma.downtimeCause.create({ data: { name: "Pause planifiée", code: "PP", type: "PLANNED", responsibility: "PRODUCTION" } }),
  ]);

  await Promise.all([
    prisma.downtimeSubCause.create({ data: { name: "Convoyeur bloqué", code: "PM-01", causeId: causes[0].id } }),
    prisma.downtimeSubCause.create({ data: { name: "Bourrage blistéreuse", code: "PM-02", causeId: causes[0].id } }),
    prisma.downtimeSubCause.create({ data: { name: "Rouleau usé", code: "PM-03", causeId: causes[0].id } }),
    prisma.downtimeSubCause.create({ data: { name: "Capteur défaillant", code: "PE-01", causeId: causes[1].id } }),
    prisma.downtimeSubCause.create({ data: { name: "Automate en défaut", code: "PE-02", causeId: causes[1].id } }),
    prisma.downtimeSubCause.create({ data: { name: "AC manquant", code: "AM-01", causeId: causes[4].id } }),
    prisma.downtimeSubCause.create({ data: { name: "Vrac non disponible", code: "AM-02", causeId: causes[4].id } }),
    prisma.downtimeSubCause.create({ data: { name: "Défaut d'aspect", code: "DQ-01", causeId: causes[5].id } }),
    prisma.downtimeSubCause.create({ data: { name: "Hors spécification", code: "DQ-02", causeId: causes[5].id } }),
    prisma.downtimeSubCause.create({ data: { name: "Bourrage étiqueteuse", code: "MA-01", causeId: causes[8].id } }),
  ]);

  // ========================
  // KPI THRESHOLDS
  // ========================
  await Promise.all([
    prisma.kPIThreshold.create({ data: { kpiName: "oee", greenMin: 0.85, orangeMin: 0.65, redMax: 0.65 } }),
    prisma.kPIThreshold.create({ data: { kpiName: "availability", greenMin: 0.90, orangeMin: 0.75, redMax: 0.75 } }),
    prisma.kPIThreshold.create({ data: { kpiName: "performance", greenMin: 0.95, orangeMin: 0.80, redMax: 0.80 } }),
    prisma.kPIThreshold.create({ data: { kpiName: "quality", greenMin: 0.99, orangeMin: 0.95, redMax: 0.95 } }),
  ]);

  // ========================
  // PRODUCTION ENTRIES (realistic data for last 14 days)
  // ========================
  const productionEntries = [];
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      // 2-3 shifts per line per day
      const shiftsPerDay = lineIdx < 4 ? 3 : 2;

      for (let shiftIdx = 0; shiftIdx < shiftsPerDay; shiftIdx++) {
        const shift = shifts[shiftIdx % shifts.length];
        const team = teams[(dayOffset + shiftIdx) % teams.length];
        const productIdx = (lineIdx + dayOffset) % products.length;
        const product = products[productIdx];
        const format = formats.find((f) => f.productId === product.id) || formats[0];

        const plannedTime = 480;
        const plannedDowntime = 30 + Math.random() * 20;
        const plannedUsefulTime = plannedTime - plannedDowntime;

        // Random performance variation
        const perfFactor = 0.7 + Math.random() * 0.28;
        const unplannedDowntime = Math.random() * 60;
        const formatChangeTime = Math.random() > 0.7 ? 15 + Math.random() * 30 : 0;
        const adjustmentTime = Math.random() * 15;
        const cleaningTime = Math.random() > 0.5 ? 10 + Math.random() * 15 : 0;
        const qualityWaitTime = Math.random() > 0.8 ? Math.random() * 20 : 0;
        const maintenanceWaitTime = Math.random() > 0.85 ? Math.random() * 25 : 0;
        const materialWaitTime = Math.random() > 0.9 ? Math.random() * 30 : 0;
        const microStopTime = Math.random() * 10;

        const totalStops = unplannedDowntime + formatChangeTime + adjustmentTime + cleaningTime + qualityWaitTime + maintenanceWaitTime + materialWaitTime;
        const actualRunningTime = Math.max(plannedUsefulTime - totalStops, 60);

        const theoreticalSpeed = [120, 150, 130, 160, 140, 60, 45][lineIdx % 7] || 100;
        const actualSpeed = theoreticalSpeed * perfFactor;
        const quantityProduced = Math.round(actualRunningTime * actualSpeed);
        const rejectRate = 0.005 + Math.random() * 0.03;
        const quantityRejected = Math.round(quantityProduced * rejectRate);
        const quantityConform = quantityProduced - quantityRejected;

        // Calculate KPIs
        const availability = Math.min(actualRunningTime / plannedUsefulTime, 1);
        const theoreticalTime = quantityProduced / theoreticalSpeed;
        const performance = Math.min(theoreticalTime / actualRunningTime, 1);
        const quality = Math.min(quantityConform / quantityProduced, 1);
        const oee = availability * performance * quality;

        const lot = `L${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}${line.code}${(shiftIdx + 1)}`;

        productionEntries.push(
          prisma.productionEntry.create({
            data: {
              date,
              lineId: line.id,
              shiftId: shift.id,
              teamId: team.id,
              productId: product.id,
              formatId: format.id,
              lot,
              orderNumber: `OF-${2026}${(date.getMonth() + 1).toString().padStart(2, "0")}${Math.floor(Math.random() * 9000 + 1000)}`,
              plannedTime,
              plannedUsefulTime: Math.round(plannedUsefulTime * 10) / 10,
              actualRunningTime: Math.round(actualRunningTime * 10) / 10,
              plannedDowntime: Math.round(plannedDowntime * 10) / 10,
              unplannedDowntime: Math.round(unplannedDowntime * 10) / 10,
              formatChangeTime: Math.round(formatChangeTime * 10) / 10,
              adjustmentTime: Math.round(adjustmentTime * 10) / 10,
              cleaningTime: Math.round(cleaningTime * 10) / 10,
              qualityWaitTime: Math.round(qualityWaitTime * 10) / 10,
              maintenanceWaitTime: Math.round(maintenanceWaitTime * 10) / 10,
              materialWaitTime: Math.round(materialWaitTime * 10) / 10,
              microStopTime: Math.round(microStopTime * 10) / 10,
              theoreticalSpeed,
              actualSpeed: Math.round(actualSpeed * 10) / 10,
              quantityProduced,
              quantityConform,
              quantityRejected,
              availability: Math.round(availability * 10000) / 10000,
              performance: Math.round(performance * 10000) / 10000,
              quality: Math.round(quality * 10000) / 10000,
              oee: Math.round(oee * 10000) / 10000,
              status: dayOffset > 2 ? "VALIDATED" : dayOffset > 0 ? "SUBMITTED" : "DRAFT",
              createdById: supervisor.id,
              comment: dayOffset === 0 ? "Saisie en cours" : undefined,
            },
          })
        );
      }
    }
  }
  const createdEntries = await Promise.all(productionEntries);
  console.log(`Created ${createdEntries.length} production entries`);

  // ========================
  // DOWNTIME ENTRIES
  // ========================
  const downtimeEntries = [];
  for (let i = 0; i < 80; i++) {
    const dayOffset = Math.floor(Math.random() * 14);
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    const line = lines[Math.floor(Math.random() * lines.length)];
    const shift = shifts[Math.floor(Math.random() * shifts.length)];
    const cause = causes[Math.floor(Math.random() * causes.length)];

    const startHour = 6 + Math.floor(Math.random() * 16);
    const startMin = Math.floor(Math.random() * 60);
    const startTime = new Date(date);
    startTime.setHours(startHour, startMin);

    const duration = 5 + Math.random() * 55;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Find matching production entry
    const matchEntry = createdEntries.find(
      (e) =>
        e.lineId === line.id &&
        new Date(e.date).toDateString() === date.toDateString() &&
        e.shiftId === shift.id
    );

    downtimeEntries.push(
      prisma.downtimeEntry.create({
        data: {
          productionEntryId: matchEntry?.id || null,
          lineId: line.id,
          shiftId: shift.id,
          date,
          startTime,
          endTime,
          duration: Math.round(duration * 10) / 10,
          type: cause.type,
          causeId: cause.id,
          description: [
            "Intervention technique requise",
            "Problème détecté par opérateur",
            "Alerte automatique machine",
            "Contrôle qualité en cours",
            "Attente pièce de rechange",
            "Réglage effectué par technicien",
          ][Math.floor(Math.random() * 6)],
          responsibility: cause.responsibility,
          estimatedImpact: Math.round(duration * 100),
          immediateAction: Math.random() > 0.5 ? "Action corrective immédiate effectuée" : null,
          status: dayOffset > 5 ? "CLOSED" : dayOffset > 2 ? "RESOLVED" : "OPEN",
          createdById: supervisor.id,
        },
      })
    );
  }
  const createdDowntimes = await Promise.all(downtimeEntries);
  console.log(`Created ${createdDowntimes.length} downtime entries`);

  // ========================
  // ACTION PLANS
  // ========================
  const actionData = [
    { title: "Remplacer rouleaux blistéreuse BL01", desc: "Usure constatée, remplacement préventif nécessaire", priority: "HIGH" as const, status: "IN_PROGRESS" as const, progress: 60 },
    { title: "Former équipe C au changement format rapide", desc: "Réduction du temps de changement de format SMED", priority: "MEDIUM" as const, status: "TODO" as const, progress: 0 },
    { title: "Installer capteur vibration EN01", desc: "Maintenance prédictive convoyeur", priority: "HIGH" as const, status: "TODO" as const, progress: 0 },
    { title: "Réviser procédure nettoyage SIR01", desc: "Optimiser le temps de nettoyage entre lots", priority: "MEDIUM" as const, status: "IN_PROGRESS" as const, progress: 40 },
    { title: "Négocier stock sécurité AC étiquettes", desc: "Ruptures fréquentes d'articles de conditionnement", priority: "CRITICAL" as const, status: "IN_PROGRESS" as const, progress: 80 },
    { title: "Audit 5S ligne TUB01", desc: "Amélioration de l'organisation du poste", priority: "LOW" as const, status: "DONE" as const, progress: 100 },
    { title: "Calibration bascule EN02", desc: "Écarts de pesée détectés lors du contrôle IPC", priority: "HIGH" as const, status: "DONE" as const, progress: 100 },
    { title: "Mettre à jour standards de vitesse BL02", desc: "Vitesses théoriques à recalculer après modification machine", priority: "MEDIUM" as const, status: "TODO" as const, progress: 0 },
  ];

  for (const a of actionData) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + Math.floor(Math.random() * 30));
    await prisma.actionPlan.create({
      data: {
        title: a.title,
        description: a.desc,
        assignedToId: [prodChef, maintChef, qualChef, supervisor][Math.floor(Math.random() * 4)].id,
        targetDate,
        priority: a.priority,
        status: a.status,
        progress: a.progress,
        completedAt: a.status === "DONE" ? new Date() : null,
        createdById: admin.id,
        downtimeEntryId: createdDowntimes[Math.floor(Math.random() * createdDowntimes.length)]?.id || null,
      },
    });
  }
  console.log(`Created ${actionData.length} action plans`);

  console.log("\nSeed completed successfully!");
  console.log("Login: admin@pharma.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
