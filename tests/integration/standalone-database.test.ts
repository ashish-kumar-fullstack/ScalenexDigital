import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { hash } from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Actor } from "../../src/lib/access";
import { db } from "../../src/lib/db";
import {
  AuditLog,
  Notification,
  User,
  UserStatusHistory,
} from "../../src/lib/models";
import { editInfluencer } from "../../src/lib/workflows";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "standalone-test" }),
}));

let mongo: MongoMemoryServer;
let admin: Actor;
let influencerId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({
    binary: { downloadDir: "node_modules/.cache/mongodb-memory-server" },
  });
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB_NAME = "scalenex_standalone";
  await db();
  await Promise.all(
    [User, UserStatusHistory, AuditLog, Notification].map((model) =>
      model.init(),
    ),
  );
  const passwordHash = await hash("TestPassword!123", 4);
  const createdAdmin = await User.create({
    name: "Admin",
    email: "admin@standalone.test",
    passwordHash,
    role: "ADMIN",
    status: "ACTIVE",
    mustChangePassword: false,
  });
  const influencer = await User.create({
    name: "Partner",
    email: "partner@standalone.test",
    phone: "9876543210",
    instagram: "@partner",
    city: "Delhi",
    state: "Delhi",
    passwordHash,
    role: "INFLUENCER",
    status: "ACTIVE",
    referralCode: "SNX-STANDALONE-1",
    commissionPlan: "DEFAULT",
    mustChangePassword: false,
  });
  admin = {
    id: String(createdAdmin._id),
    name: createdAdmin.name,
    email: createdAdmin.email,
    role: "ADMIN",
    referralCode: "",
    mustChangePassword: false,
    sessionVersion: 0,
  };
  influencerId = String(influencer._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

it("updates influencer status when MongoDB transactions are unavailable", async () => {
  await editInfluencer(admin, influencerId, {
    name: "Partner",
    email: "partner@standalone.test",
    phone: "9876543210",
    instagram: "@partner",
    city: "Delhi",
    state: "Delhi",
    status: "SUSPENDED",
    commissionPlan: "DEFAULT",
    internalNotes: "Reviewed",
    reason: "Status workflow test",
    regenerate: false,
  });

  const updated = await User.findById(influencerId);
  expect(updated?.status).toBe("SUSPENDED");
  expect(updated?.sessionVersion).toBe(1);
  expect(
    await UserStatusHistory.exists({
      userId: influencerId,
      previousStatus: "ACTIVE",
      newStatus: "SUSPENDED",
    }),
  ).toBeTruthy();
  expect(
    await AuditLog.exists({ entityId: influencerId, action: "USER_UPDATED" }),
  ).toBeTruthy();
});
