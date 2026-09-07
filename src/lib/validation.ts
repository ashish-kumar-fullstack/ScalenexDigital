import { z } from "zod";
import {
  userStatuses,
  leadStatuses,
  paymentStatuses,
  serviceNames,
} from "./constants";
const text = z.string().trim().min(1).max(200);
const note = z.string().trim().max(3000).default("");
const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s()-]{10,20}$/, "Enter a valid phone number");
const url = z
  .union([
    z.literal(""),
    z.url().refine((v) => /^https?:\/\//i.test(v), "Use an http or https URL"),
  ])
  .optional();
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(72)
  .refine(
    (v) => new TextEncoder().encode(v).length <= 72,
    "Password must be at most 72 bytes",
  );
export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(72),
});
export const userSchema = z.object({
  name: text,
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  phone,
  instagram: text,
  city: text,
  state: text,
  password: passwordSchema,
  status: z.enum(userStatuses),
  commissionPlan: z.enum(["DEFAULT", "OVERRIDE"]).default("DEFAULT"),
  overridePercentage: z.coerce.number().int().min(0).max(100).optional(),
  internalNotes: note,
});
export const leadSchema = z
  .object({
    businessName: text,
    contactName: text,
    phone,
    whatsapp: phone,
    email: z.union([z.literal(""), z.email().max(254)]).default(""),
    category: text,
    city: text,
    state: text,
    website: url,
    instagramUrl: url,
    presence: note,
    services: z
      .array(z.enum(serviceNames))
      .min(1, "Select at least one service"),
    budget: text,
    contactTime: text,
    notes: note,
    consent: z.literal(true, { error: "Customer consent is required" }),
  })
  .strict();
export const statusSchema = z
  .object({
    status: z.enum(leadStatuses),
    reason: note,
    visibleNote: note,
    internalNote: note,
  })
  .refine(
    (v) =>
      !["LOST", "DUPLICATE", "INVALID"].includes(v.status) ||
      v.reason.length > 0,
    { message: "A reason is required", path: ["reason"] },
  );
export const paymentSchema = z.object({
  projectValue: z.string(),
  received: z.string(),
  approved: z.string(),
  status: z.enum(paymentStatuses),
  method: z.string().max(100),
  transactionId: z.string().max(200),
  paymentDate: z.string().max(30),
  adminNote: note,
  visibleNote: note,
  reason: text,
  confirmed: z.literal(true),
  revision: z.coerce.number().int().min(0),
});
export function normalizePhone(value: string) {
  const n = value.replace(/\D/g, "");
  return n.length === 10 ? "91" + n : n;
}
export function normalizeLead(v: z.infer<typeof leadSchema>) {
  return {
    normalizedPhone: normalizePhone(v.phone),
    normalizedEmail: v.email.toLowerCase().trim(),
    normalizedBusiness: v.businessName.toLowerCase().replace(/[^a-z0-9]/g, ""),
    normalizedDomain: v.website
      ? new URL(v.website).hostname.toLowerCase().replace(/^www\./, "")
      : "",
  };
}
