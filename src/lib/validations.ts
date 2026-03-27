import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const productionEntrySchema = z.object({
  date: z.string().min(1, "Date requise"),
  lineId: z.string().min(1, "Ligne requise"),
  shiftId: z.string().min(1, "Shift requis"),
  teamId: z.string().optional(),
  productId: z.string().min(1, "Produit requis"),
  formatId: z.string().min(1, "Format requis"),
  lot: z.string().min(1, "Lot requis"),
  orderNumber: z.string().optional(),
  plannedTime: z.coerce.number().min(0, "Doit être >= 0"),
  plannedUsefulTime: z.coerce.number().min(0, "Doit être >= 0"),
  actualRunningTime: z.coerce.number().min(0, "Doit être >= 0"),
  plannedDowntime: z.coerce.number().min(0).default(0),
  unplannedDowntime: z.coerce.number().min(0).default(0),
  formatChangeTime: z.coerce.number().min(0).default(0),
  adjustmentTime: z.coerce.number().min(0).default(0),
  cleaningTime: z.coerce.number().min(0).default(0),
  qualityWaitTime: z.coerce.number().min(0).default(0),
  maintenanceWaitTime: z.coerce.number().min(0).default(0),
  materialWaitTime: z.coerce.number().min(0).default(0),
  microStopTime: z.coerce.number().min(0).default(0),
  theoreticalSpeed: z.coerce.number().min(0, "Doit être >= 0"),
  actualSpeed: z.coerce.number().min(0, "Doit être >= 0"),
  quantityProduced: z.coerce.number().min(0, "Doit être >= 0"),
  quantityConform: z.coerce.number().min(0, "Doit être >= 0"),
  quantityRejected: z.coerce.number().min(0).default(0),
  comment: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "VALIDATED", "REJECTED"]).default("DRAFT"),
});

export const downtimeEntrySchema = z.object({
  productionEntryId: z.string().optional(),
  lineId: z.string().min(1, "Ligne requise"),
  shiftId: z.string().optional(),
  date: z.string().min(1, "Date requise"),
  startTime: z.string().min(1, "Heure début requise"),
  endTime: z.string().optional(),
  duration: z.coerce.number().min(0).optional(),
  type: z.enum(["PLANNED", "UNPLANNED"]),
  causeId: z.string().min(1, "Cause requise"),
  subCauseId: z.string().optional(),
  description: z.string().optional(),
  responsibility: z.enum(["PRODUCTION", "MAINTENANCE", "QUALITE", "LOGISTIQUE", "AUTRE"]),
  estimatedImpact: z.coerce.number().min(0).optional(),
  immediateAction: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).default("OPEN"),
});

export const actionPlanSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  downtimeEntryId: z.string().optional(),
  causeId: z.string().optional(),
  assignedToId: z.string().min(1, "Responsable requis"),
  targetDate: z.string().min(1, "Date cible requise"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED", "OVERDUE"]).default("TODO"),
  progress: z.coerce.number().min(0).max(100).default(0),
  comment: z.string().optional(),
});

export type ProductionEntryInput = z.input<typeof productionEntrySchema>;
export type DowntimeEntryInput = z.input<typeof downtimeEntrySchema>;
export type ActionPlanInput = z.input<typeof actionPlanSchema>;
