import "server-only";
import { hash } from "bcryptjs";
import { dbTransaction } from "./db";
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
      "Your account is active and ready. You can sign in now with the password you created. If you already have an account, use Sign in or Forgot password.",
  };
  try {
    await rateLimit("registration-global", 50, 3600);
    await rateLimit("registration:" + v.email, 3, 3600);
    if (await User.exists({ email: v.email })) return success;
    const passwordHash = await hash(v.password, 12);
    await dbTransaction(async (session) => {
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
            status: "ACTIVE",
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
            newStatus: "ACTIVE",
            reason:
              "Public registration activated automatically; terms and privacy accepted",
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
              status: "ACTIVE",
              termsAcceptedAt: new Date(),
            },
            reason: "Public registration activated automatically",
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
            message: `${v.name} has registered and their account is active. View their account in Influencers.`,
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
