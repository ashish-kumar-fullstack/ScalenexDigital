import { afterAll, beforeAll, expect, it } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { compare } from "bcryptjs";
import { bootstrapDatabase } from "../../src/lib/bootstrap";
import { User, CommissionRule } from "../../src/lib/models";
let repl: MongoMemoryReplSet;
beforeAll(async () => {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = repl.getUri();
  process.env.MONGODB_DB_NAME = "bootstrap_test";
  process.env.INITIAL_ADMIN_EMAIL = "admin@example.com";
  process.env.INITIAL_ADMIN_PASSWORD = "ExamplePassword123!";
});
afterAll(async () => {
  await mongoose.disconnect();
  await repl?.stop();
});
it("creates a working admin and repairs rules without resetting credentials or status", async () => {
  expect((await bootstrapDatabase())?.created).toBe(true);
  const admin = await User.findOne({ email: "admin@example.com" }).select(
    "+passwordHash",
  );
  expect(admin.status).toBe("ACTIVE");
  expect(admin.mustChangePassword).toBe(true);
  expect(await compare("ExamplePassword123!", admin.passwordHash)).toBe(true);
  expect(await CommissionRule.countDocuments()).toBe(3);
  await User.updateOne(
    { _id: admin._id },
    { $set: { status: "SUSPENDED", mustChangePassword: false } },
  );
  await CommissionRule.deleteMany({});
  delete process.env.INITIAL_ADMIN_PASSWORD;
  expect((await bootstrapDatabase())?.created).toBe(false);
  const existing = await User.findById(admin._id).select("+passwordHash");
  expect(existing.passwordHash).toBe(admin.passwordHash);
  expect(existing.status).toBe("SUSPENDED");
  expect(existing.mustChangePassword).toBe(false);
  expect(await CommissionRule.countDocuments()).toBe(3);
});
it("does not promote an influencer with the configured email", async () => {
  await User.updateOne(
    { email: "admin@example.com" },
    { $set: { role: "INFLUENCER" } },
  );
  await expect(bootstrapDatabase()).rejects.toThrow("non-admin");
  expect((await User.findOne({ email: "admin@example.com" })).role).toBe(
    "INFLUENCER",
  );
});
