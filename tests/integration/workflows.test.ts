import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { db } from "../../src/lib/db";
import {
  User,
  Lead,
  Payment,
  LeadStatusHistory,
  AuditLog,
  CommissionRule,
  Notification,
} from "../../src/lib/models";
import {
  createInfluencer,
  createLead,
  editInfluencer,
  updateLead,
  savePayment,
  saveRules,
  getLead,
  getPayment,
} from "../../src/lib/workflows";
import type { Actor } from "../../src/lib/access";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "integration-test" }),
}));
let repl: MongoMemoryReplSet,
  admin: Actor,
  alice: Actor,
  bob: Actor,
  leadId: string;
const fixture = {
  businessName: "Acme Services",
  contactName: "Customer",
  phone: "9876543210",
  whatsapp: "9876543210",
  email: "customer@example.com",
  category: "Services",
  city: "Delhi",
  state: "Delhi",
  website: "https://acme.example.com",
  instagramUrl: "",
  presence: "Business profile",
  services: ["SEO"],
  budget: "₹40,000",
  contactTime: "Afternoon",
  notes: "Call first",
  consent: true,
};
const profile = (name: string) => ({
  name,
  email: name.toLowerCase() + "@example.test",
  phone: "9876543210",
  instagram: "@" + name,
  city: "Delhi",
  state: "Delhi",
  password: "TemporaryPassword!123",
  status: "ACTIVE",
  commissionPlan: "DEFAULT",
  internalNotes: "Private account note",
});
const payment = (revision = 0) => ({
  projectValue: "40000",
  received: "10000",
  approved: "4000",
  status: "COMMISSION_APPROVED",
  method: "Bank transfer",
  transactionId: "",
  paymentDate: "",
  adminNote: "Private payment note",
  visibleNote: "Approved",
  reason: "Verified client receipt",
  confirmed: true,
  revision,
});
beforeAll(async () => {
  repl = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { downloadDir: "node_modules/.cache/mongodb-memory-server" },
  });
  process.env.MONGODB_URI = repl.getUri();
  process.env.MONGODB_DB_NAME = "scalenex_integration";
  await db();
  await Promise.all(
    [
      User,
      Lead,
      Payment,
      LeadStatusHistory,
      AuditLog,
      CommissionRule,
      Notification,
    ].map((m) => m.init()),
  );
  const u = await User.create({
    name: "Admin",
    email: "admin@example.test",
    passwordHash: await hash("TestPassword!123", 4),
    role: "ADMIN",
    status: "ACTIVE",
    mustChangePassword: false,
  });
  admin = {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: "ADMIN",
    referralCode: "",
    mustChangePassword: false,
    sessionVersion: 0,
  };
});
afterAll(async () => {
  await mongoose.disconnect();
  await repl?.stop();
});
describe("secure referral lifecycle against a real MongoDB replica set", () => {
  it("admin creates influencers with unique indexed referral codes", async () => {
    const aid = await createInfluencer(admin, profile("Alice"));
    const bid = await createInfluencer(admin, profile("Bob"));
    await User.updateMany(
      { _id: { $in: [aid, bid] } },
      { $set: { mustChangePassword: false } },
    );
    const [a, b] = await Promise.all([User.findById(aid), User.findById(bid)]);
    alice = {
      id: aid,
      name: a.name,
      email: a.email,
      role: "INFLUENCER",
      referralCode: a.referralCode,
      mustChangePassword: false,
      sessionVersion: 0,
    };
    bob = {
      id: bid,
      name: b.name,
      email: b.email,
      role: "INFLUENCER",
      referralCode: b.referralCode,
      mustChangePassword: false,
      sessionVersion: 0,
    };
    expect(a.referralCode).not.toBe(b.referralCode);
    await expect(
      User.updateOne({ _id: bid }, { $set: { referralCode: a.referralCode } }),
    ).rejects.toThrow();
  });
  it("influencers cannot create accounts or change official statuses", async () => {
    await expect(createInfluencer(alice, profile("Mallory"))).rejects.toThrow(
      "Not authorized",
    );
    await expect(
      updateLead(alice, new mongoose.Types.ObjectId().toString(), {
        status: "WON",
      }),
    ).rejects.toThrow("Not authorized");
    await expect(
      savePayment(alice, new mongoose.Types.ObjectId().toString(), payment()),
    ).rejects.toThrow("Not authorized");
  });
  it("derives ownership and referral attribution from the authenticated database record", async () => {
    leadId = await createLead({ ...alice, referralCode: "FORGED" }, fixture);
    const lead = await Lead.findById(leadId);
    expect(String(lead.influencerId)).toBe(alice.id);
    expect(lead.referralCodeSnapshot).toBe(alice.referralCode);
    expect(lead.leadStatus).toBe("NEW");
    await expect(
      createLead(alice, { ...fixture, influencerId: bob.id }),
    ).rejects.toThrow();
    await expect(
      createLead(alice, { ...fixture, referralCode: bob.referralCode }),
    ).rejects.toThrow();
  });
  it("scopes individual lead reads to the owner", async () => {
    expect(await getLead(bob, leadId)).toBeNull();
    expect(await getLead(alice, leadId)).not.toBeNull();
  });
  it("flags normalized duplicates without changing ownership", async () => {
    const id = await createLead(bob, { ...fixture, phone: "+91 98765 43210" });
    const l = await Lead.findById(id);
    expect(l.duplicateFlag).toBe(true);
    expect(String(l.influencerId)).toBe(bob.id);
  });
  it("records status history, visible notifications and requires rejection reasons", async () => {
    await expect(
      updateLead(admin, leadId, {
        status: "LOST",
        reason: "",
        visibleNote: "",
        internalNote: "",
      }),
    ).rejects.toThrow();
    await updateLead(admin, leadId, {
      status: "WON",
      reason: "Contract accepted",
      visibleNote: "Ready to start",
      internalNote: "Private negotiation",
    });
    expect(await LeadStatusHistory.countDocuments({ leadId })).toBe(2);
    expect(await Notification.countDocuments({ userId: alice.id })).toBe(1);
    const dto = await getLead(alice, leadId);
    expect(dto.internalNote).toBeUndefined();
  });
  it("saves financial snapshots and atomic audit records; denies cross-owner reads", async () => {
    await savePayment(admin, leadId, payment());
    const p = await getPayment(alice, leadId);
    expect(p.percentage).toBe(40);
    expect(p.calculatedPaise).toBe(400000);
    expect(p.adminNote).toBeUndefined();
    expect(await getPayment(bob, leadId)).toBeNull();
    expect(await AuditLog.countDocuments({ action: "PAYMENT_UPDATED" })).toBe(
      1,
    );
    expect((await Lead.findById(leadId)).paymentStatus).toBe(
      "COMMISSION_APPROVED",
    );
  });
  it("preserves percentage snapshots after tier changes and rejects stale financial edits", async () => {
    await saveRules(admin, [{ minPaise: 0, maxPaise: null, percentage: 10 }]);
    await savePayment(admin, leadId, {
      ...payment(1),
      received: "20000",
      approved: "8000",
    });
    const p = await getPayment(alice, leadId);
    expect(p.percentage).toBe(40);
    expect(p.calculatedPaise).toBe(800000);
    await expect(savePayment(admin, leadId, payment(1))).rejects.toThrow(
      "Payment changed",
    );
  });
  it("regenerating a referral code preserves old lead attribution", async () => {
    const { password: discard, ...edit } = profile("Alice");
    void discard;
    await editInfluencer(admin, alice.id, {
      ...edit,
      regenerate: true,
      reason: "Partner requested a new code",
    });
    expect((await User.findById(alice.id)).referralCode).not.toBe(
      alice.referralCode,
    );
    expect((await Lead.findById(leadId)).referralCodeSnapshot).toBe(
      alice.referralCode,
    );
  });
  it("revokes suspended accounts even with an existing actor/session", async () => {
    const { password: discard, ...edit } = profile("Bob");
    void discard;
    await editInfluencer(admin, bob.id, {
      ...edit,
      status: "SUSPENDED",
      reason: "Review",
      regenerate: false,
    });
    await expect(createLead(bob, fixture)).rejects.toThrow("Not authorized");
  });
});
