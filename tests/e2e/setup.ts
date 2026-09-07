import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import {
  User,
  Lead,
  Payment,
  Notification,
  AuditLog,
  LeadStatusHistory,
  CommissionRule,
  RateLimit,
} from "../../src/lib/models";
export default async function setup() {
  const repl = await MongoMemoryReplSet.create({
    instanceOpts: [{ port: 27027 }],
    replSet: { count: 1, name: "testset" },
    binary: { downloadDir: "node_modules/.cache/mongodb-memory-server" },
  });
  await mongoose.connect(repl.getUri(), { dbName: "scalenex_e2e" });
  await Promise.all(
    [
      User,
      Lead,
      Payment,
      Notification,
      AuditLog,
      LeadStatusHistory,
      CommissionRule,
      RateLimit,
    ].map((m) => m.init()),
  );
  const passwordHash = await hash("BrowserTest!1234", 4);
  await User.insertMany([
    {
      name: "Test Admin",
      email: "admin@example.test",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: false,
    },
    {
      name: "Test Partner",
      email: "partner@example.test",
      passwordHash,
      role: "INFLUENCER",
      status: "ACTIVE",
      referralCode: "SNX-TEST-A1234",
      mustChangePassword: false,
    },
    {
      name: "Blocked Partner",
      email: "blocked@example.test",
      passwordHash,
      role: "INFLUENCER",
      status: "BLOCKED",
      referralCode: "SNX-BLOCKED-B1234",
      mustChangePassword: false,
    },
    {
      name: "Suspended Partner",
      email: "suspended@example.test",
      passwordHash,
      role: "INFLUENCER",
      status: "SUSPENDED",
      referralCode: "SNX-SUSPENDED-C1234",
      mustChangePassword: false,
    },
    {
      name: "New Partner",
      email: "new@example.test",
      passwordHash,
      role: "INFLUENCER",
      status: "ACTIVE",
      referralCode: "SNX-NEW-D1234",
      mustChangePassword: true,
    },
  ]);
  await mongoose.disconnect();
  return async () => {
    await repl.stop();
  };
}
