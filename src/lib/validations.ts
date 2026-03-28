import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const batchSchema = z.object({
  lot: z.string().min(1, "N° lot requis"),
  lineId: z.string().min(1, "Ligne requise"),
  productId: z.string().min(1, "Produit requis"),
  shiftId: z.string().min(1, "Shift requis"),
  date: z.string().min(1, "Date requise"),
  orderNumber: z.string().optional(),
  comment: z.string().optional(),
  status: z.string().default("OPEN"),
});

export const downtimeEventSchema = z.object({
  batchId: z.string().min(1, "Lot requis"),
  subCategoryId: z.string().min(1, "Sous-catégorie requise"),
  startTime: z.string().min(1, "Heure début requise"),
  endTime: z.string().optional(),
  duration: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
});

export const productionDeclarationSchema = z.object({
  batchId: z.string().min(1, "Lot requis"),
  quantityProduced: z.coerce.number().min(0).default(0),
  quantityConform: z.coerce.number().min(0).default(0),
  quantityRejected: z.coerce.number().min(0).default(0),
  comment: z.string().optional(),
});

export type BatchInput = z.input<typeof batchSchema>;
export type DowntimeEventInput = z.input<typeof downtimeEventSchema>;
export type ProductionDeclarationInput = z.input<typeof productionDeclarationSchema>;
