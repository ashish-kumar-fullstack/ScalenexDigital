import { z } from "zod";
export function serverEnv() {
  return z
    .object({
      MONGODB_URI: z.string().min(1),
      MONGODB_DB_NAME: z.string().min(1).default("scalenex"),
      AUTH_SECRET: z.string().min(32),
      NEXT_PUBLIC_APP_URL: z.url(),
    })
    .parse(process.env);
}
export const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
