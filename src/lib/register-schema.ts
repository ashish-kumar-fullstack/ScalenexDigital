import { z } from "zod";
import { passwordSchema } from "./validation";
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100),
    email: z
      .string()
      .trim()
      .pipe(z.email("Enter a valid email address."))
      .transform((v) => v.toLowerCase()),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]{10,20}$/, "Enter a valid phone number."),
    instagram: z
      .string()
      .trim()
      .min(1, "Enter your Instagram handle.")
      .max(100),
    city: z.string().trim().min(1, "Enter your city.").max(100),
    state: z.string().trim().min(1, "Enter your state.").max(100),
    password: passwordSchema,
    confirmPassword: z.string(),
    consent: z.literal(true, {
      error: "Please accept the terms and privacy policy.",
    }),
    website: z.string().max(0),
  })
  .strict()
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don’t match.",
  });
