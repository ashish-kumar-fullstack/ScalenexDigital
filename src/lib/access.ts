import "server-only";
import { redirect } from "next/navigation";
import { session } from "./auth";
import { db } from "./db";
import { User } from "./models";
import { allowed, type Role } from "./constants";
export type Actor = {
  id: string;
  name: string;
  email: string;
  role: Role;
  referralCode: string;
  mustChangePassword: boolean;
  sessionVersion: number;
};
export async function requireActor(
  permission?: string,
  allowPasswordChange = false,
): Promise<Actor> {
  const s = await session();
  if (!s?.user?.id) redirect("/login");
  await db();
  const u = await User.findById(s.user.id);
  if (!u || u.status !== "ACTIVE" || u.sessionVersion !== s.user.sessionVersion)
    redirect("/login?expired=1");
  if (u.mustChangePassword && !allowPasswordChange)
    redirect("/" + u.role.toLowerCase() + "/change-password");
  if (permission && !allowed(u.role, permission))
    throw new Error("You do not have permission for this action");
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    referralCode: u.referralCode || "",
    mustChangePassword: u.mustChangePassword,
    sessionVersion: u.sessionVersion,
  };
}
export const ownerScope = (actor: Actor) =>
  actor.role === "ADMIN" ? {} : { influencerId: actor.id };
