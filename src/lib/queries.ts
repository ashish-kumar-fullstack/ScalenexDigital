import "server-only";
import { z } from "zod";
import { Lead, User, Payment, AuditLog } from "./models";
import { type Actor, ownerScope } from "./access";
import type { Types } from "mongoose";
export type LeadRow = {
  _id: Types.ObjectId;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  leadStatus: string;
  paymentStatus: string;
  submittedAt: Date;
  duplicateFlag: boolean;
  referralCodeSnapshot: string;
};
export type UserRow = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  status: string;
  referralCode: string;
  city: string;
  createdAt: Date;
};
export type PaymentRow = {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  referralCodeSnapshot: string;
  projectPaise: number;
  receivedPaise: number;
  percentage: number;
  calculatedPaise: number;
  approvedPaise: number;
  status: string;
  transactionId: string;
  paymentDate?: Date;
  visibleNote?: string;
  createdAt: Date;
};
export type AuditRow = {
  _id: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  role: string;
  actor: Types.ObjectId;
  reason: string;
  createdAt: Date;
  previousData: unknown;
  newData: unknown;
};
export type Params = Record<string, string | string[] | undefined>;
export function filters(params: Params, dateField = "submittedAt") {
  const p = z
    .object({
      q: z.string().max(100).optional(),
      status: z.string().max(50).optional(),
      from: z.string().date().optional(),
      to: z.string().date().optional(),
      page: z.coerce.number().int().min(1).max(10000).catch(1),
    })
    .safeParse(params);
  const values = p.success ? p.data : { page: 1 };
  const date: Record<string, Date> = {};
  if (values.from) date.$gte = new Date(values.from);
  if (values.to) date.$lte = new Date(values.to + "T23:59:59.999Z");
  return {
    ...values,
    dateFilter: Object.keys(date).length ? { [dateField]: date } : {},
    skip: (values.page - 1) * 20,
  };
}
export async function leads(a: Actor, params: Params) {
  const f = filters(params);
  const query = {
    ...ownerScope(a),
    ...f.dateFilter,
    ...(f.status ? { leadStatus: f.status } : {}),
    ...(f.q
      ? {
          businessName: {
            $regex: f.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    Lead.find(query)
      .select(
        "businessName contactName phone email city leadStatus paymentStatus submittedAt duplicateFlag referralCodeSnapshot",
      )
      .sort({ submittedAt: -1 })
      .skip(f.skip)
      .limit(20)
      .lean<LeadRow[]>(),
    Lead.countDocuments(query),
  ]);
  return { rows, total, page: f.page };
}
export async function users(a: Actor, params: Params) {
  if (a.role !== "ADMIN") throw new Error("Not authorized");
  const f = filters(params, "createdAt");
  const query = {
    role: "INFLUENCER",
    ...f.dateFilter,
    ...(f.status ? { status: f.status } : {}),
    ...(f.q
      ? {
          name: {
            $regex: f.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    User.find(query)
      .select("name email phone status referralCode city createdAt")
      .sort({ createdAt: -1 })
      .skip(f.skip)
      .limit(20)
      .lean<UserRow[]>(),
    User.countDocuments(query),
  ]);
  return { rows, total, page: f.page };
}
export async function payments(a: Actor, params: Params) {
  const f = filters(params, "createdAt");
  const query = {
    ...ownerScope(a),
    ...f.dateFilter,
    ...(f.status ? { status: f.status } : {}),
  };
  const [rows, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(f.skip)
      .limit(20)
      .lean<PaymentRow[]>(),
    Payment.countDocuments(query),
  ]);
  return { rows, total, page: f.page };
}
export async function auditRows(a: Actor, params: Params) {
  if (a.role !== "ADMIN") throw new Error("Not authorized");
  const f = filters(params, "createdAt");
  return {
    rows: await AuditLog.find(f.dateFilter)
      .sort({ createdAt: -1 })
      .skip(f.skip)
      .limit(20)
      .lean<AuditRow[]>(),
    total: await AuditLog.countDocuments(f.dateFilter),
    page: f.page,
  };
}
