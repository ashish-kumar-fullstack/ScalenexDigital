import "server-only";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { registerSchema } from "./register-schema";
import { User, UserStatusHistory, AuditLog, Notification } from "./models";
import { rateLimit, referralCode } from "./security";

export async function registerInfluencer(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: "Please check your details, password confirmation, and consent.",
    };
  const v = parsed.data;
  const success = {
    ok: true,
    message:
      "Your registration has been received. New accounts need admin approval before sign-in. If you already have an account, use Sign in or Forgot password.",
  };
  try {
    await rateLimit("registration-global", 50, 3600);
    await rateLimit("registration:" + v.email, 3, 3600);
    if (await User.exists({ email: v.email })) return success;
    const passwordHash = await hash(v.password, 12);
    await mongoose.connection.transaction(async (session) => {
      const [user] = await User.create(
        [
          {
            name: v.name,
            email: v.email,
            phone: v.phone,
            instagram: v.instagram,
            city: v.city,
            state: v.state,
            passwordHash,
            role: "INFLUENCER",
            status: "PENDING",
            mustChangePassword: false,
            referralCode: referralCode(v.name),
            commissionPlan: "DEFAULT",
          },
        ],
        { session },
      );
      await UserStatusHistory.create(
        [
          {
            userId: user._id,
            previousStatus: "",
            newStatus: "PENDING",
            reason: "Public registration; terms and privacy accepted",
            changedBy: user._id,
          },
        ],
        { session },
      );
      await AuditLog.create(
        [
          {
            actor: user._id,
            role: "INFLUENCER",
            action: "SELF_REGISTRATION",
            entityType: "User",
            entityId: user._id,
            previousData: null,
            newData: {
              role: "INFLUENCER",
              status: "PENDING",
              termsAcceptedAt: new Date(),
            },
            reason: "Public registration awaiting admin approval",
            ip: "unavailable",
            userAgent: "",
          },
        ],
        { session },
      );
      const admins = await User.find({ role: "ADMIN", status: "ACTIVE" })
        .select("_id")
        .session(session);
      if (admins.length)
        await Notification.insertMany(
          admins.map((admin) => ({
            userId: admin._id,
            title: "New influencer registration",
            message: `${v.name} has registered and is awaiting approval. Review their account in Influencers.`,
            type: "ACCOUNT",
            relatedId: user._id,
          })),
          { session },
        );
    });
    return success;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000 &&
      (await User.exists({ email: v.email }))
    )
      return success;
    return {
      ok: false,
      message:
        "We couldn’t complete registration right now. Please try again later or contact scalenexdigital@gmail.com.",
    };
  }
}
