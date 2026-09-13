import { notFound } from "next/navigation";
import { requireActor } from "@/lib/access";
import { User, UserStatusHistory } from "@/lib/models";
import { validId } from "@/lib/workflows";
import { Heading } from "@/components/portal-server";
import { UserForm, UserStatusForm } from "@/components/portal-forms";
import { label } from "@/lib/utils";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireActor("users:manage");
  const { id } = await params;
  validId(id);
  const u = await User.findOne({ _id: id, role: "INFLUENCER" }).select(
    "+internalNotes",
  );
  if (!u) notFound();
  const history = await UserStatusHistory.find({ userId: id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<
      {
        _id: string;
        previousStatus: string;
        newStatus: string;
        reason: string;
        createdAt: Date;
      }[]
    >();
  return (
    <>
      <Heading
        title={u.name}
        description={`Referral code: ${u.referralCode}`}
        action={{ href: "/admin/influencers", text: "All influencers" }}
      />
      <UserStatusForm id={id} status={u.status} />
      <UserForm
        id={id}
        initial={{
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          instagram: u.instagram || "",
          city: u.city || "",
          state: u.state || "",
          status: u.status,
          commissionPlan: u.commissionPlan,
          overridePercentage: u.overridePercentage,
          internalNotes: u.internalNotes || "",
        }}
      />
      <section className="panel">
        <h2 style={{ fontSize: 22 }}>Account status history</h2>
        <ol className="timeline">
          {history.map((h) => (
            <li key={String(h._id)}>
              <strong>
                {label(h.previousStatus || "Created")} → {label(h.newStatus)}
              </strong>
              <p>{h.reason}</p>
              <small>{new Date(h.createdAt).toLocaleString("en-IN")}</small>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
