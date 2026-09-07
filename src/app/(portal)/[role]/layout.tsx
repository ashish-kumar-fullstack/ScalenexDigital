import { notFound, redirect } from "next/navigation";
import { requireActor } from "@/lib/access";
import { Notification } from "@/lib/models";
import { PortalShell } from "@/components/portal-shell";
export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
  title: "Partner workspace",
};
export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ role: string }>;
  children: React.ReactNode;
}) {
  const { role } = await params;
  if (!["admin", "influencer"].includes(role)) notFound();
  const a = await requireActor(undefined, true);
  if (a.role.toLowerCase() !== role)
    redirect("/" + a.role.toLowerCase() + "/dashboard");
  const [notifications, unread] = await Promise.all([
    Notification.find({ userId: a.id })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean<{ _id: string; title: string; message: string; read: boolean }[]>(),
    Notification.countDocuments({ userId: a.id, read: false }),
  ]);
  return (
    <PortalShell
      role={a.role}
      name={a.name}
      unread={unread}
      notices={notifications.map((n) => ({
        id: String(n._id),
        title: n.title,
        message: n.message,
        read: n.read,
      }))}
    >
      {children}
    </PortalShell>
  );
}
