import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const batchSchema = z.object({
  lot: z.string().min(1, "N° lot requis"),
  lineId: z.string().min(1, "Ligne requise"),
  productId: z.string().min(1, "Produit requis"),
  date: z.string().min(1, "Date requise"),
  shift: z.string().min(1, "Shift requis"),
  orderNumber: z.string().optional(),
  plannedTime: z.coerce.number().min(0).default(0),
  actualRunningTime: z.coerce.number().min(0).default(0),
  theoreticalSpeed: z.coerce.number().min(0).default(0),
  actualSpeed: z.coerce.number().min(0).default(0),
  quantityProduced: z.coerce.number().min(0).default(0),
  quantityConform: z.coerce.number().min(0).default(0),
  quantityRejected: z.coerce.number().min(0).default(0),
  comment: z.string().optional(),
  status: z.string().default("DRAFT"),
});

export const downtimeSchema = z.object({
  batchId: z.string().min(1, "Lot requis"),
  downtimeTypeId: z.string().min(1, "Type d'arrêt requis"),
  startTime: z.string().min(1, "Heure début requise"),
  endTime: z.string().optional(),
  duration: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
});

export type BatchInput = z.input<typeof batchSchema>;
export type DowntimeInput = z.input<typeof downtimeSchema>;
