import "server-only";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { isIP } from "node:net";
import { z } from "zod";
import { db, dbTransaction, type DatabaseSession } from "./db";
import {
  User,
  Lead,
  Payment,
  LeadStatusHistory,
  UserStatusHistory,
  Notification,
  AuditLog,
  CommissionRule,
} from "./models";
import { type Actor, ownerScope } from "./access";
import { allowed, userStatuses, type Role } from "./constants";
import {
  userSchema,
  leadSchema,
  normalizeLead,
  statusSchema,
  paymentSchema,
} from "./validation";
import { referralCode } from "./security";
import {
  calculateCommission,
  defaultTiers,
  rupeesToPaise,
  type Tier,
} from "./commission";
async function authorize(a: Actor, permission: string) {
  await db();
  const u = await User.findOne({
    _id: a.id,
    status: "ACTIVE",
    sessionVersion: a.sessionVersion,
    mustChangePassword: false,
  });
  if (!u || u.role !== a.role || !allowed(u.role as Role, permission))
    throw new Error("Not authorized");
  return u;
}
export function validId(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new Error("Record not found");
  return id;
}
async function context() {
  try {
    const h = await headers();
    const ip =
      process.env.VERCEL === "1"
        ? (h.get("x-vercel-forwarded-for") || "").split(",")[0].trim()
        : "";
    return {
      ip: isIP(ip) ? ip : "unavailable",
      userAgent: (h.get("user-agent") || "").slice(0, 300),
    };
  } catch {
    return { ip: "unavailable", userAgent: "integration-test" };
  }
}
export async function audit(
  a: Actor,
  action: string,
  entityType: string,
  entityId: unknown,
  previousData: unknown,
  newData: unknown,
  reason: string,
  s: DatabaseSession,
) {
  await AuditLog.create(
    [
      {
        actor: a.id,
        role: a.role,
        action,
        entityType,
        entityId,
        previousData,
        newData,
        reason,
        ...(await context()),
      },
    ],
    { session: s },
  );
}
async function notify(
  userId: unknown,
  title: string,
  message: string,
  type: string,
  relatedId: unknown,
  s: DatabaseSession,
) {
  await Notification.create([{ userId, title, message, type, relatedId }], {
    session: s,
  });
}
async function transaction<T>(fn: (s: DatabaseSession) => Promise<T>) {
  return dbTransaction(fn);
}
export async function createInfluencer(a: Actor, input: unknown) {
  await authorize(a, "users:manage");
  const v = userSchema.parse(input);
  if (v.commissionPlan === "OVERRIDE" && v.overridePercentage === undefined)
    throw new Error("Enter a custom commission percentage");
  const passwordHash = await hash(v.password, 12);
  return transaction(async (s) => {
    const { password: discard, ...profile } = v;
    void discard;
    const [u] = await User.create(
      [
        {
          ...profile,
          passwordHash,
          role: "INFLUENCER",
          referralCode: referralCode(v.name),
          createdBy: a.id,
          mustChangePassword: true,
        },
      ],
      s ? { session: s } : {},
    );
    await audit(
      a,
      "USER_CREATED",
      "User",
      u._id,
      null,
      { name: v.name, email: v.email, status: v.status },
      "Admin-created account",
      s,
    );
    await UserStatusHistory.create(
      [
        {
          userId: u._id,
          previousStatus: "",
          newStatus: v.status,
          reason: "Account created",
          changedBy: a.id,
        },
      ],
      { session: s },
    );
    return String(u._id);
  });
}
export async function editInfluencer(a: Actor, id: string, input: unknown) {
  await authorize(a, "users:manage");
  validId(id);
  const v = userSchema
    .omit({ password: true })
    .extend({
      reason: z.string().trim().min(1).max(500),
      regenerate: z.boolean().default(false),
    })
    .parse(input);
  if (v.commissionPlan === "OVERRIDE" && v.overridePercentage === undefined)
    throw new Error("Enter a custom commission percentage");
  return transaction(async (s) => {
    const u = await User.findOne({ _id: id, role: "INFLUENCER" }).session(s);
    if (!u) throw new Error("Record not found");
    const old = u.status;
    const { reason, regenerate, ...profile } = v;
    Object.assign(u, profile);
    if (regenerate) u.referralCode = referralCode(u.name);
    if (old !== u.status) {
      u.sessionVersion++;
      await UserStatusHistory.create(
        [
          {
            userId: id,
            previousStatus: old,
            newStatus: u.status,
            reason,
            changedBy: a.id,
          },
        ],
        { session: s },
      );
      await notify(
        id,
        "Account status updated",
        `Your account is now ${u.status.toLowerCase()}.`,
        "ACCOUNT",
        u._id,
        s,
      );
    }
    await u.save({ session: s });
    await audit(
      a,
      "USER_UPDATED",
      "User",
      u._id,
      { status: old },
      { status: u.status, referralCode: u.referralCode },
      reason,
      s,
    );
  });
}

export async function updateInfluencerStatus(
  a: Actor,
  id: string,
  input: unknown,
) {
  await authorize(a, "users:manage");
  validId(id);
  const v = z
    .object({
      status: z.enum(userStatuses),
      reason: z.string().trim().min(1).max(500),
    })
    .parse(input);
  return transaction(async (s) => {
    const u = await User.findOne({ _id: id, role: "INFLUENCER" }).session(s);
    if (!u) throw new Error("Record not found");
    const previousStatus = u.status;
    if (previousStatus === v.status) return;
    u.status = v.status;
    u.sessionVersion++;
    await u.save({ session: s });
    await UserStatusHistory.create(
      [
        {
          userId: id,
          previousStatus,
          newStatus: v.status,
          reason: v.reason,
          changedBy: a.id,
        },
      ],
      { session: s },
    );
    await notify(
      id,
      "Account status updated",
      `Your account is now ${v.status.toLowerCase()}.`,
      "ACCOUNT",
      u._id,
      s,
    );
    await audit(
      a,
      "USER_STATUS_UPDATED",
      "User",
      u._id,
      { status: previousStatus },
      { status: v.status },
      v.reason,
      s,
    );
  });
}
export async function createLead(a: Actor, input: unknown) {
  const u = await authorize(a, "leads:create");
  const v = leadSchema.parse(input);
  const normalized = normalizeLead(v);
  return transaction(async (s) => {
    const conditions = Object.entries(normalized)
      .filter(([, value]) => value)
      .map(([key, value]) => ({ [key]: value }));
    const duplicate = await Lead.exists({ $or: conditions }).session(s);
    const [l] = await Lead.create(
      [
        {
          ...v,
          ...normalized,
          influencerId: u._id,
          referralCodeSnapshot: u.referralCode,
          leadStatus: "NEW",
          paymentStatus: "NOT_ELIGIBLE",
          submittedAt: new Date(),
          createdBy: u._id,
          duplicateFlag: !!duplicate,
        },
      ],
      { session: s },
    );
    await LeadStatusHistory.create(
      [
        {
          leadId: l._id,
          previousStatus: "",
          newStatus: "NEW",
          reason: "Lead submitted",
          changedBy: u._id,
        },
      ],
      { session: s },
    );
    await audit(
      a,
      "LEAD_CREATED",
      "Lead",
      l._id,
      null,
      { leadStatus: "NEW", duplicateFlag: !!duplicate },
      "Customer consent confirmed",
      s,
    );
    return String(l._id);
  });
}
export async function updateLead(a: Actor, id: string, input: unknown) {
  await authorize(a, "leads:update");
  validId(id);
  const v = statusSchema.parse(input);
  return transaction(async (s) => {
    const l = await Lead.findById(id).session(s);
    if (!l) throw new Error("Record not found");
    const previous = l.leadStatus;
    l.leadStatus = v.status;
    l.visibleNote = v.visibleNote;
    l.internalNote = v.internalNote;
    if (v.status === "DUPLICATE" || v.reason.startsWith("Ownership resolved:"))
      l.duplicateFlag = false;
    await l.save({ session: s });
    if (previous !== v.status)
      await LeadStatusHistory.create(
        [
          {
            leadId: id,
            previousStatus: previous,
            newStatus: v.status,
            reason: v.reason,
            changedBy: a.id,
          },
        ],
        { session: s },
      );
    await audit(
      a,
      "LEAD_UPDATED",
      "Lead",
      l._id,
      { leadStatus: previous },
      { leadStatus: v.status, visibleNote: v.visibleNote },
      v.reason,
      s,
    );
    await notify(
      l.influencerId,
      "Lead update",
      `${l.businessName}: ${v.status.toLowerCase().replaceAll("_", " ")}${v.visibleNote ? ". " + v.visibleNote : ""}`,
      "LEAD",
      l._id,
      s,
    );
  });
}
export async function commissionTiers(s?: DatabaseSession): Promise<Tier[]> {
  await db();
  const now = new Date();
  const q = CommissionRule.find({
    active: true,
    effectiveFrom: { $lte: now },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gt: now } }],
  }).sort({ minPaise: 1 });
  if (s) q.session(s);
  const rules = await q;
  return rules.length
    ? rules.map((r) => ({
        minPaise: r.minPaise,
        maxPaise: r.maxPaise,
        percentage: r.percentage,
      }))
    : defaultTiers;
}
export async function savePayment(a: Actor, id: string, input: unknown) {
  await authorize(a, "payments:manage");
  validId(id);
  const v = paymentSchema.parse(input);
  const projectPaise = rupeesToPaise(v.projectValue),
    receivedPaise = rupeesToPaise(v.received),
    approvedPaise = rupeesToPaise(v.approved);
  if (approvedPaise > receivedPaise)
    throw new Error("Approved commission cannot exceed client receipts");
  return transaction(async (s) => {
    const lead = await Lead.findById(id).session(s);
    if (!lead) throw new Error("Record not found");
    if (lead.duplicateFlag || lead.leadStatus !== "WON")
      throw new Error(
        "Resolve duplicates and mark the lead won before recording commission",
      );
    const old = await Payment.findOne({ leadId: id }).session(s);
    if (old && old.revision !== v.revision)
      throw new Error("Payment changed. Refresh and review again.");
    if (!old && v.revision !== 0) throw new Error("Refresh and try again");
    if (old?.status === "PAID")
      throw new Error(
        "Paid records are immutable. Record a reconciliation separately.",
      );
    const u = await User.findById(lead.influencerId).session(s);
    const tiers = old
      ? [{ minPaise: 0, maxPaise: null, percentage: old.percentage }]
      : u?.commissionPlan === "OVERRIDE"
        ? [{ minPaise: 0, maxPaise: null, percentage: u.overridePercentage }]
        : await commissionTiers(s);
    const calc = calculateCommission(projectPaise, receivedPaise, tiers);
    if (
      ["COMMISSION_APPROVED", "PROCESSING", "PAID"].includes(v.status) &&
      (!receivedPaise || !approvedPaise)
    )
      throw new Error("Client receipts and approved commission are required");
    if (
      v.status === "PAID" &&
      (!v.transactionId ||
        !v.method ||
        !v.paymentDate ||
        Number.isNaN(Date.parse(v.paymentDate)))
    )
      throw new Error("Payment method, transaction ID and date are required");
    const data = {
      leadId: lead._id,
      influencerId: lead.influencerId,
      referralCodeSnapshot: lead.referralCodeSnapshot,
      projectPaise,
      receivedPaise,
      ...calc,
      approvedPaise,
      currency: "INR",
      status: v.status,
      method: v.method,
      transactionId: v.transactionId,
      paymentDate: v.paymentDate ? new Date(v.paymentDate) : undefined,
      adminNote: v.adminNote,
      visibleNote: v.visibleNote,
      createdBy: old?.createdBy || a.id,
      updatedBy: a.id,
      revision: (old?.revision || 0) + 1,
    };
    await Payment.findOneAndUpdate(
      { leadId: id },
      { $set: data },
      { upsert: true, session: s, runValidators: true },
    );
    lead.paymentStatus = v.status;
    await lead.save({ session: s });
    await audit(
      a,
      "PAYMENT_UPDATED",
      "Payment",
      lead._id,
      old ? { status: old.status, approvedPaise: old.approvedPaise } : null,
      {
        status: v.status,
        approvedPaise,
        receivedPaise,
        percentage: calc.percentage,
      },
      v.reason,
      s,
    );
    await notify(
      lead.influencerId,
      "Commission update",
      `${lead.businessName}: ${v.status.toLowerCase().replaceAll("_", " ")}${v.visibleNote ? ". " + v.visibleNote : ""}`,
      "PAYMENT",
      lead._id,
      s,
    );
  });
}
export async function saveRules(a: Actor, input: unknown) {
  await authorize(a, "settings:manage");
  const tiers = z
    .array(
      z.object({
        minPaise: z.number().int().min(0).max(100000000000),
        maxPaise: z.number().int().positive().max(100000000000).nullable(),
        percentage: z.number().int().min(0).max(100),
      }),
    )
    .min(1)
    .max(10)
    .parse(input)
    .sort((x, y) => x.minPaise - y.minPaise);
  if (
    tiers[0].minPaise !== 0 ||
    tiers.at(-1)?.maxPaise !== null ||
    tiers.some(
      (t, i) =>
        (t.maxPaise !== null && t.maxPaise <= t.minPaise) ||
        (i < tiers.length - 1 && t.maxPaise !== tiers[i + 1].minPaise),
    )
  )
    throw new Error("Tiers must cover all amounts without gaps or overlap");
  return transaction(async (s) => {
    const previous = await commissionTiers(s);
    await CommissionRule.updateMany(
      { active: true },
      { $set: { active: false, effectiveTo: new Date(), updatedBy: a.id } },
      s ? { session: s } : {},
    );
    await CommissionRule.insertMany(
      tiers.map((t) => ({
        ...t,
        active: true,
        createdBy: a.id,
        updatedBy: a.id,
      })),
      { session: s },
    );
    await audit(
      a,
      "COMMISSION_RULES_UPDATED",
      "CommissionRule",
      new mongoose.Types.ObjectId(),
      previous,
      tiers,
      "Admin updated commission tiers",
      s,
    );
  });
}
export async function getLead(a: Actor, id: string) {
  await authorize(a, a.role === "ADMIN" ? "leads:all" : "leads:own");
  return Lead.findOne({ _id: validId(id), ...ownerScope(a) });
}
export async function getPayment(a: Actor, leadId: string) {
  await authorize(a, a.role === "ADMIN" ? "payments:manage" : "payments:own");
  return Payment.findOne({ leadId: validId(leadId), ...ownerScope(a) });
}
