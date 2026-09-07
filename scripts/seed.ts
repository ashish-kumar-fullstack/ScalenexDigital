import { hash } from "bcryptjs";
import { db } from "../src/lib/db";
import {
  User,
  Lead,
  Payment,
  LeadStatusHistory,
  UserStatusHistory,
  Notification,
  AuditLog,
  CommissionRule,
  PasswordReset,
  RateLimit,
} from "../src/lib/models";
import { serverEnv } from "../src/lib/env";
import { passwordSchema } from "../src/lib/validation";
import { defaultTiers } from "../src/lib/commission";
import { z } from "zod";
async function main() {
  serverEnv();
  const email = z
    .email()
    .parse(process.env.INITIAL_ADMIN_EMAIL)
    .trim()
    .toLowerCase();
  const password = passwordSchema.parse(process.env.INITIAL_ADMIN_PASSWORD);
  await db();
  await Promise.all(
    [
      User,
      Lead,
      Payment,
      LeadStatusHistory,
      UserStatusHistory,
      Notification,
      AuditLog,
      CommissionRule,
      PasswordReset,
      RateLimit,
    ].map((m) => m.createIndexes()),
  );
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "ADMIN")
      throw new Error("Seed email already belongs to a non-admin account");
    console.log("Admin account already exists; credentials unchanged.");
    return;
  }
  const u = await User.create({
    name: "ScaleNex Digital Admin",
    email,
    passwordHash: await hash(password, 12),
    role: "ADMIN",
    status: "ACTIVE",
    mustChangePassword: true,
  });
  if (!(await CommissionRule.exists({ active: true })))
    await CommissionRule.insertMany(
      defaultTiers.map((t) => ({ ...t, createdBy: u._id, updatedBy: u._id })),
    );
  console.log(
    "Admin account created. Password change required on first login.",
  );
}
main()
  .catch(() => {
    console.error(
      "Seed failed. Check environment configuration and database access.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    const { default: mongoose } = await import("mongoose");
    await mongoose.disconnect();
  });
