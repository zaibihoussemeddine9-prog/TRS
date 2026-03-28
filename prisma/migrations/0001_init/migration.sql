Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DIRECTION', 'RESP_PRODUCTION', 'RESP_MAINTENANCE', 'RESP_QUALITE', 'SUPERVISEUR', 'LECTURE_SEULE');

-- CreateEnum
CREATE TYPE "DowntimeType" AS ENUM ('PLANNED', 'UNPLANNED');

-- CreateEnum
CREATE TYPE "Responsibility" AS ENUM ('PRODUCTION', 'MAINTENANCE', 'QUALITE', 'LOGISTIQUE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DowntimeStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ActionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'OVERDUE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'LECTURE_SEULE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workshop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingLine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "lineType" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "family" TEXT,
    "form" TEXT,
    "dosage" TEXT,
    "primaryPackaging" TEXT,
    "secondaryPackaging" TEXT,
    "standardLotSize" DOUBLE PRECISION,
    "targetYield" DOUBLE PRECISION,
    "targetRejectRate" DOUBLE PRECISION,
    "targetOEE" DOUBLE PRECISION,
    "qualityConstraints" TEXT,
    "processConstraints" TEXT,
    "planningNotes" TEXT,
    "comments" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Format" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitsPerBlister" INTEGER,
    "blistersPerBox" INTEGER,
    "boxesPerCarton" INTEGER,
    "cartonsPerPallet" INTEGER,
    "unitsPerPack" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Format_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLineConfig" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "nominalSpeed" DOUBLE PRECISION,
    "standardSpeed" DOUBLE PRECISION,
    "startupTime" DOUBLE PRECISION,
    "lineEmptyingTime" DOUBLE PRECISION,
    "formatChangeTime" DOUBLE PRECISION,
    "lotChangeTime" DOUBLE PRECISION,
    "cleaningTime" DOUBLE PRECISION,
    "adjustmentTime" DOUBLE PRECISION,
    "targetOEE" DOUBLE PRECISION,
    "comments" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductLineConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DowntimeCause" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DowntimeType" NOT NULL,
    "responsibility" "Responsibility" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DowntimeCause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DowntimeSubCause" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DowntimeSubCause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionEntry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "lineId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "teamId" TEXT,
    "productId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "lot" TEXT NOT NULL,
    "orderNumber" TEXT,
    "plannedTime" DOUBLE PRECISION NOT NULL,
    "plannedUsefulTime" DOUBLE PRECISION NOT NULL,
    "actualRunningTime" DOUBLE PRECISION NOT NULL,
    "plannedDowntime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unplannedDowntime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "formatChangeTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjustmentTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cleaningTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityWaitTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maintenanceWaitTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "materialWaitTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "microStopTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "theoreticalSpeed" DOUBLE PRECISION NOT NULL,
    "actualSpeed" DOUBLE PRECISION NOT NULL,
    "quantityProduced" DOUBLE PRECISION NOT NULL,
    "quantityConform" DOUBLE PRECISION NOT NULL,
    "quantityRejected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availability" DOUBLE PRECISION,
    "performance" DOUBLE PRECISION,
    "quality" DOUBLE PRECISION,
    "oee" DOUBLE PRECISION,
    "comment" TEXT,
    "status" "ValidationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DowntimeEntry" (
    "id" TEXT NOT NULL,
    "productionEntryId" TEXT,
    "lineId" TEXT NOT NULL,
    "shiftId" TEXT,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "type" "DowntimeType" NOT NULL,
    "causeId" TEXT NOT NULL,
    "subCauseId" TEXT,
    "description" TEXT,
    "responsibility" "Responsibility" NOT NULL,
    "estimatedImpact" DOUBLE PRECISION,
    "immediateAction" TEXT,
    "status" "DowntimeStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DowntimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "downtimeEntryId" TEXT,
    "causeId" TEXT,
    "assignedToId" TEXT NOT NULL,
    "targetDate" DATE NOT NULL,
    "priority" "ActionPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ActionStatus" NOT NULL DEFAULT 'TODO',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPIThreshold" (
    "id" TEXT NOT NULL,
    "lineId" TEXT,
    "kpiName" TEXT NOT NULL,
    "greenMin" DOUBLE PRECISION NOT NULL,
    "orangeMin" DOUBLE PRECISION NOT NULL,
    "redMax" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KPIThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Site_name_key" ON "Site"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Workshop_code_key" ON "Workshop"("code");

-- CreateIndex
CREATE INDEX "Workshop_siteId_idx" ON "Workshop"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingLine_code_key" ON "PackagingLine"("code");

-- CreateIndex
CREATE INDEX "PackagingLine_workshopId_idx" ON "PackagingLine"("workshopId");

-- CreateIndex
CREATE INDEX "PackagingLine_code_idx" ON "PackagingLine"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Format_code_key" ON "Format"("code");

-- CreateIndex
CREATE INDEX "Format_productId_idx" ON "Format"("productId");

-- CreateIndex
CREATE INDEX "ProductLineConfig_productId_idx" ON "ProductLineConfig"("productId");

-- CreateIndex
CREATE INDEX "ProductLineConfig_lineId_idx" ON "ProductLineConfig"("lineId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductLineConfig_productId_lineId_key" ON "ProductLineConfig"("productId", "lineId");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_name_key" ON "Shift"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_code_key" ON "Shift"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DowntimeCause_code_key" ON "DowntimeCause"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DowntimeSubCause_code_key" ON "DowntimeSubCause"("code");

-- CreateIndex
CREATE INDEX "DowntimeSubCause_causeId_idx" ON "DowntimeSubCause"("causeId");

-- CreateIndex
CREATE INDEX "ProductionEntry_date_idx" ON "ProductionEntry"("date");

-- CreateIndex
CREATE INDEX "ProductionEntry_lineId_idx" ON "ProductionEntry"("lineId");

-- CreateIndex
CREATE INDEX "ProductionEntry_shiftId_idx" ON "ProductionEntry"("shiftId");

-- CreateIndex
CREATE INDEX "ProductionEntry_productId_idx" ON "ProductionEntry"("productId");

-- CreateIndex
CREATE INDEX "ProductionEntry_lineId_date_idx" ON "ProductionEntry"("lineId", "date");

-- CreateIndex
CREATE INDEX "ProductionEntry_status_idx" ON "ProductionEntry"("status");

-- CreateIndex
CREATE INDEX "DowntimeEntry_lineId_idx" ON "DowntimeEntry"("lineId");

-- CreateIndex
CREATE INDEX "DowntimeEntry_date_idx" ON "DowntimeEntry"("date");

-- CreateIndex
CREATE INDEX "DowntimeEntry_causeId_idx" ON "DowntimeEntry"("causeId");

-- CreateIndex
CREATE INDEX "DowntimeEntry_lineId_date_idx" ON "DowntimeEntry"("lineId", "date");

-- CreateIndex
CREATE INDEX "ActionPlan_status_idx" ON "ActionPlan"("status");

-- CreateIndex
CREATE INDEX "ActionPlan_assignedToId_idx" ON "ActionPlan"("assignedToId");

-- CreateIndex
CREATE INDEX "ActionPlan_targetDate_idx" ON "ActionPlan"("targetDate");

-- CreateIndex
CREATE INDEX "KPIThreshold_kpiName_idx" ON "KPIThreshold"("kpiName");

-- CreateIndex
CREATE UNIQUE INDEX "KPIThreshold_lineId_kpiName_key" ON "KPIThreshold"("lineId", "kpiName");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Workshop" ADD CONSTRAINT "Workshop_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingLine" ADD CONSTRAINT "PackagingLine_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Format" ADD CONSTRAINT "Format_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLineConfig" ADD CONSTRAINT "ProductLineConfig_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLineConfig" ADD CONSTRAINT "ProductLineConfig_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "PackagingLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeSubCause" ADD CONSTRAINT "DowntimeSubCause_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "DowntimeCause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "PackagingLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "Format"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_productionEntryId_fkey" FOREIGN KEY ("productionEntryId") REFERENCES "ProductionEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "PackagingLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "DowntimeCause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_subCauseId_fkey" FOREIGN KEY ("subCauseId") REFERENCES "DowntimeSubCause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_downtimeEntryId_fkey" FOREIGN KEY ("downtimeEntryId") REFERENCES "DowntimeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPIThreshold" ADD CONSTRAINT "KPIThreshold_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "PackagingLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

