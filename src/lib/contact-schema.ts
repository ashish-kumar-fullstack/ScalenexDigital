import { z } from "zod";
import { serviceNames } from "./constants";

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(100),
    email: z
      .string()
      .trim()
      .pipe(z.email("Enter a valid email address."))
      .transform((value) => value.toLowerCase()),
    phone: z
      .string()
      .trim()
      .max(20)
      .refine(
        (value) => !value || /^\+?[\d\s()-]{10,20}$/.test(value),
        "Enter a valid phone number.",
      ),
    business: z.string().trim().max(150),
    service: z.enum(serviceNames),
    message: z
      .string()
      .trim()
      .min(10, "Tell us a little more (at least 10 characters).")
      .max(5000),
    consent: z.literal(true, {
      error: "Please agree to be contacted about your enquiry.",
    }),
    website: z.string().max(0),
  })
  .strict();

export type ContactResult = { ok: boolean; message: string };
