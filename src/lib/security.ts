import { createHash, randomBytes } from "node:crypto";
import { RateLimit } from "./models";
import { db } from "./db";
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const referralCode = (name: string) =>
  `SNX-${
    name
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 10) || "PARTNER"
  }-${randomBytes(5).toString("hex").toUpperCase()}`;
export async function rateLimit(key: string, limit: number, seconds: number) {
  await db();
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const id = tokenHash(`${key}:${bucket}`);
  const row = await RateLimit.findOneAndUpdate(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 1) * seconds * 1000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (row.count > limit) throw new Error("Please try again later");
}
