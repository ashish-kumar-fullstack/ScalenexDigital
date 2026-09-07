import { requireActor } from "@/lib/access";
import { User } from "@/lib/models";
import { Heading } from "@/components/portal-server";
import { CopyCode } from "@/components/portal-widgets";
export default async function Page() {
  const a = await requireActor("profile:own");
  const u = await User.findById(a.id);
  return (
    <>
      <Heading
        title="My profile"
        description="Your partner details and referral identity."
        action={{
          href: "/influencer/change-password",
          text: "Change password",
        }}
      />
      <div className="detail-grid">
        <section className="panel">
          <h2 style={{ fontSize: 21 }}>Account information</h2>
          <dl className="detail-list">
            {[
              ["Name", u.name],
              ["Email", u.email],
              ["Phone", u.phone],
              ["Instagram", u.instagram],
              ["City", u.city],
              ["State", u.state],
              ["Status", u.status],
              [
                "Commission plan",
                u.commissionPlan === "OVERRIDE"
                  ? `${u.overridePercentage}% custom plan`
                  : "Standard configurable tiers",
              ],
            ].map(([title, value]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
          <p style={{ fontSize: 13, marginTop: 25 }}>
            Contact the admin team to correct your profile details.
          </p>
        </section>
        <section className="panel referral-panel">
          <h2 style={{ fontSize: 25 }}>Your referral code</h2>
          <CopyCode code={a.referralCode} />
          <p>
            This code is assigned by ScaleNex Digital. Your leads are linked to
            your account automatically.
          </p>
        </section>
      </div>
    </>
  );
}
