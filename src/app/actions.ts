"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { z } from "zod";
import { requireActor } from "@/lib/access";
import {
  createInfluencer,
  editInfluencer,
  updateInfluencerStatus,
  createLead,
  updateLead,
  savePayment,
  saveRules,
  audit,
} from "@/lib/workflows";
import { User, PasswordReset, Notification } from "@/lib/models";
import { rateLimit, tokenHash } from "@/lib/security";
import { passwordSchema } from "@/lib/validation";
import { appUrl } from "@/lib/env";
type Result = { ok: boolean; message: string; id?: string };
export async function mutate(
  action: string,
  id: string,
  input: unknown,
): Promise<Result> {
  const a = await requireActor();
  try {
    let result: string | undefined;
    switch (action) {
      case "createUser":
        result = await createInfluencer(a, input);
        break;
      case "editUser":
        await editInfluencer(a, id, input);
        break;
      case "updateUserStatus":
        await updateInfluencerStatus(a, id, input);
        break;
      case "createLead":
        await rateLimit("lead:" + a.id, 20, 3600);
        result = await createLead(a, input);
        break;
      case "updateLead":
        await updateLead(a, id, input);
        break;
      case "payment":
        await savePayment(a, id, input);
        break;
      case "rules":
        await saveRules(a, input);
        break;
      default:
        throw new Error("Invalid action");
    }
    revalidatePath("/admin", "layout");
    revalidatePath("/influencer", "layout");
    return { ok: true, message: "Changes saved successfully.", id: result };
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof z.ZodError
          ? e.issues.map((i) => i.message).join(". ")
          : e instanceof Error &&
              [
                "Record not found",
                "Not authorized",
                "Payment changed. Refresh and review again.",
                "Resolve duplicates and mark the lead won before recording commission",
                "Paid records are immutable. Record a reconciliation separately.",
                "Approved commission cannot exceed client receipts",
                "Client receipts and approved commission are required",
                "Payment method, transaction ID and date are required",
                "Tiers must cover all amounts without gaps or overlap",
              ].includes(e.message)
            ? e.message
            : "Unable to save. Check your entries and try again.",
    };
  }
}
export async function afterLogin() {
  const a = await requireActor(undefined, true);
  redirect(
    `/${a.role.toLowerCase()}/${a.mustChangePassword ? "change-password" : "dashboard"}`,
  );
}
export async function changePassword(input: unknown): Promise<Result> {
  const a = await requireActor(undefined, true);
  try {
    const v = z
      .object({ current: z.string().max(72), password: passwordSchema })
      .parse(input);
    await rateLimit("password:" + a.id, 5, 900);
    const u = await User.findById(a.id).select("+passwordHash");
    if (!u || !(await compare(v.current, u.passwordHash)))
      return {
        ok: false,
        message: "Unable to update password. Check your current password.",
      };
    const passwordHash = await hash(v.password, 12);
    await mongoose.connection.transaction(async (s) => {
      await User.updateOne(
        { _id: a.id },
        {
          $set: { passwordHash, mustChangePassword: false },
          $inc: { sessionVersion: 1 },
        },
        { session: s },
      );
      await audit(
        a,
        "PASSWORD_CHANGED",
        "User",
        u._id,
        null,
        null,
        "Self-service password change",
        s,
      );
    });
    return { ok: true, message: "Password updated. Please sign in again." };
  } catch {
    return {
      ok: false,
      message: "Unable to change password. Use 12–72 characters and try again.",
    };
  }
}
export async function forgotPassword(input: unknown): Promise<Result> {
  const message =
    "If an active account matches that email, a reset link will be sent.";
  try {
    const email = z.email().parse(input).toLowerCase().trim();
    await rateLimit("reset:" + email, 3, 3600);
    await rateLimit("reset-global", 30, 3600);
    const u = await User.findOne({ email, status: "ACTIVE" });
    if (u) {
      const token = randomBytes(32).toString("hex");
      await PasswordReset.create({
        userId: u._id,
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + 1800000),
      });
      const port = Number(process.env.SMTP_PORT || 587);
      const mail = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });
      await mail.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Reset your ScaleNex Digital password",
        text: `Reset your password within 30 minutes: ${appUrl()}/reset-password?token=${token}\nIf you did not request this, ignore this message.`,
      });
    }
  } catch {
    /* Never expose account existence or provider details. */
  }
  return { ok: true, message };
}
export async function resetPassword(input: unknown): Promise<Result> {
  try {
    const v = z
      .object({
        token: z.string().regex(/^[a-f0-9]{64}$/),
        password: passwordSchema,
      })
      .parse(input);
    await rateLimit("reset-token:" + tokenHash(v.token), 5, 900);
    const passwordHash = await hash(v.password, 12);
    await mongoose.connection.transaction(async (s) => {
      const reset = await PasswordReset.findOneAndUpdate(
        {
          tokenHash: tokenHash(v.token),
          expiresAt: { $gt: new Date() },
          usedAt: null,
        },
        { $set: { usedAt: new Date() } },
        { session: s },
      );
      if (!reset) throw new Error("Invalid token");
      await User.updateOne(
        { _id: reset.userId, status: "ACTIVE" },
        {
          $set: { passwordHash, mustChangePassword: false },
          $inc: { sessionVersion: 1 },
        },
        { session: s },
      );
      await PasswordReset.deleteMany({ userId: reset.userId }, { session: s });
    });
    return { ok: true, message: "Password updated. You can now sign in." };
  } catch {
    return {
      ok: false,
      message: "This reset link is invalid or expired. Request a new one.",
    };
  }
}
export async function markNotifications(id?: string) {
  const a = await requireActor();
  await Notification.updateMany(
    {
      userId: a.id,
      ...(id
        ? {
            _id: z
              .string()
              .regex(/^[a-f\d]{24}$/i)
              .parse(id),
          }
        : {}),
    },
    { $set: { read: true } },
  );
  revalidatePath("/influencer", "layout");
  revalidatePath("/admin", "layout");
}
