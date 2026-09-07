export const roles = ["ADMIN", "INFLUENCER"] as const;
export const userStatuses = [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "BLOCKED",
] as const;
export const leadStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
  "ON_HOLD",
  "DUPLICATE",
  "INVALID",
] as const;
export const paymentStatuses = [
  "NOT_ELIGIBLE",
  "PENDING_CLIENT_PAYMENT",
  "CLIENT_PAYMENT_RECEIVED",
  "COMMISSION_CALCULATED",
  "COMMISSION_APPROVED",
  "PROCESSING",
  "PAID",
  "CANCELLED",
  "DISPUTED",
] as const;
export const serviceNames = [
  "Website development",
  "Landing page",
  "SEO",
  "Social media marketing",
  "Google Ads",
  "Meta Ads",
  "UGC Ads",
  "AI automation",
  "Custom software",
  "Branding",
  "Other",
] as const;
export type Role = (typeof roles)[number];
export const permissions: Record<Role, readonly string[]> = {
  ADMIN: [
    "users:manage",
    "leads:all",
    "leads:update",
    "payments:manage",
    "settings:manage",
    "audit:read",
  ],
  INFLUENCER: ["leads:create", "leads:own", "payments:own", "profile:own"],
};
export function allowed(role: Role, permission: string) {
  return permissions[role]?.includes(permission) ?? false;
}
