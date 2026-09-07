import mongoose, { Schema } from "mongoose";
import {
  roles,
  userStatuses,
  leadStatuses,
  paymentStatuses,
} from "./constants";
const ref = { type: Schema.Types.ObjectId, ref: "User", required: true };
const opts = { timestamps: true, strict: "throw" as const };
const user = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: roles, required: true },
    status: { type: String, enum: userStatuses, default: "PENDING" },
    phone: String,
    instagram: String,
    city: String,
    state: String,
    referralCode: { type: String, unique: true, sparse: true },
    commissionPlan: { type: String, default: "DEFAULT" },
    overridePercentage: Number,
    internalNotes: { type: String, select: false },
    mustChangePassword: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
    lastLogin: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  opts,
);
const lead = new Schema(
  {
    businessName: String,
    contactName: String,
    phone: String,
    whatsapp: String,
    email: String,
    category: String,
    city: String,
    state: String,
    website: String,
    instagramUrl: String,
    presence: String,
    services: [String],
    budget: String,
    contactTime: String,
    notes: String,
    normalizedPhone: { type: String, index: true },
    normalizedEmail: { type: String, index: true },
    normalizedBusiness: { type: String, index: true },
    normalizedDomain: { type: String, index: true },
    influencerId: ref,
    referralCodeSnapshot: String,
    leadStatus: { type: String, enum: leadStatuses, default: "NEW" },
    paymentStatus: {
      type: String,
      enum: paymentStatuses,
      default: "NOT_ELIGIBLE",
    },
    duplicateFlag: { type: Boolean, default: false },
    consent: { type: Boolean, required: true },
    submittedAt: Date,
    createdBy: ref,
    visibleNote: String,
    internalNote: { type: String, select: false },
  },
  opts,
);
lead.index({ influencerId: 1, submittedAt: -1 });
const history = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, required: true, index: true },
    previousStatus: String,
    newStatus: String,
    reason: String,
    changedBy: ref,
    changedAt: { type: Date, default: Date.now },
  },
  opts,
);
const userHistory = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    previousStatus: String,
    newStatus: String,
    reason: String,
    changedBy: ref,
    changedAt: { type: Date, default: Date.now },
  },
  opts,
);
const payment = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, required: true, unique: true },
    influencerId: ref,
    referralCodeSnapshot: String,
    projectPaise: Number,
    receivedPaise: Number,
    percentage: Number,
    calculatedPaise: Number,
    approvedPaise: Number,
    currency: { type: String, default: "INR" },
    status: { type: String, enum: paymentStatuses },
    method: String,
    transactionId: String,
    paymentDate: Date,
    adminNote: { type: String, select: false },
    visibleNote: String,
    createdBy: ref,
    updatedBy: ref,
    revision: { type: Number, default: 0 },
  },
  opts,
);
payment.index({ influencerId: 1, createdAt: -1 });
const notification = new Schema(
  {
    userId: ref,
    title: String,
    message: String,
    type: String,
    relatedId: Schema.Types.ObjectId,
    read: { type: Boolean, default: false },
  },
  opts,
);
notification.index({ userId: 1, read: 1, createdAt: -1 });
const audit = new Schema(
  {
    actor: ref,
    role: String,
    action: String,
    entityType: String,
    entityId: Schema.Types.ObjectId,
    previousData: Schema.Types.Mixed,
    newData: Schema.Types.Mixed,
    reason: String,
    ip: String,
    userAgent: String,
  },
  opts,
);
const rule = new Schema(
  {
    minPaise: { type: Number, required: true },
    maxPaise: { type: Number, default: null },
    percentage: { type: Number, required: true },
    active: { type: Boolean, default: true },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveTo: Date,
    createdBy: ref,
    updatedBy: ref,
  },
  opts,
);
const reset = new Schema(
  {
    userId: ref,
    tokenHash: { type: String, unique: true },
    expiresAt: Date,
    usedAt: Date,
  },
  opts,
);
reset.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const rate = new Schema({ _id: String, count: Number, expiresAt: Date });
rate.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const User = mongoose.models.User || mongoose.model("User", user);
export const Lead = mongoose.models.Lead || mongoose.model("Lead", lead);
export const LeadStatusHistory =
  mongoose.models.LeadStatusHistory ||
  mongoose.model("LeadStatusHistory", history);
export const UserStatusHistory =
  mongoose.models.UserStatusHistory ||
  mongoose.model("UserStatusHistory", userHistory);
export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", payment);
export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notification);
export const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", audit);
export const CommissionRule =
  mongoose.models.CommissionRule || mongoose.model("CommissionRule", rule);
export const PasswordReset =
  mongoose.models.PasswordReset || mongoose.model("PasswordReset", reset);
export const RateLimit =
  mongoose.models.RateLimit || mongoose.model("RateLimit", rate);
