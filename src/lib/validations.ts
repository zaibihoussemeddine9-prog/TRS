import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Service requis"),
  customerName: z.string().min(2, "Nom requis"),
  customerPhone: z.string().min(8, "Téléphone requis"),
  customerEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  carBrand: z.string().optional(),
  carModel: z.string().optional(),
  carPlate: z.string().optional(),
  carColor: z.string().optional(),
  date: z.string().min(1, "Date requise"),
  timeSlot: z.string().min(1, "Créneau requis"),
  notes: z.string().optional(),
});

export type BookingInput = z.input<typeof bookingSchema>;
