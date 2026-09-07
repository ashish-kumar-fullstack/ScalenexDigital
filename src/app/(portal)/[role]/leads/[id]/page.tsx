import { notFound } from "next/navigation";
import { requireActor } from "@/lib/access";
import { getLead, getPayment, commissionTiers } from "@/lib/workflows";
import { LeadStatusHistory, Lead, Payment, User } from "@/lib/models";
import { Heading, Badge } from "@/components/portal-server";
import {
  LeadStatusForm,
  PaymentForm,
  type PaymentFields,
} from "@/components/portal-forms";
import { money, label } from "@/lib/utils";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const a = await requireActor();
  const { id } = await params;
  const l = await getLead(a, id);
  if (!l) notFound();
  const admin = a.role === "ADMIN";
  const [history, payment, tiers] = await Promise.all([
    LeadStatusHistory.find({ leadId: id })
      .sort({ createdAt: -1 })
      .lean<
        { _id: string; newStatus: string; reason: string; createdAt: Date }[]
      >(),
    getPayment(a, id),
    commissionTiers(),
  ]);
  let internalNote = "",
    adminNote = "";
  if (admin) {
    internalNote =
      (await Lead.findById(id).select("+internalNote"))?.internalNote || "";
    adminNote =
      (await Payment.findOne({ leadId: id }).select("+adminNote"))?.adminNote ||
      "";
  }
  const u = admin ? await User.findById(l.influencerId) : null;
  const plan =
    u?.commissionPlan === "OVERRIDE"
      ? [{ minPaise: 0, maxPaise: null, percentage: u.overridePercentage }]
      : tiers;
  const initial: PaymentFields | undefined = payment
    ? {
        projectPaise: payment.projectPaise,
        receivedPaise: payment.receivedPaise,
        approvedPaise: payment.approvedPaise,
        percentage: payment.percentage,
        status: payment.status,
        method: payment.method || "",
        transactionId: payment.transactionId || "",
        paymentDate: payment.paymentDate
          ? new Date(payment.paymentDate).toISOString().slice(0, 10)
          : "",
        adminNote,
        visibleNote: payment.visibleNote || "",
        revision: payment.revision,
      }
    : undefined;
  return (
    <>
      <Heading
        title={l.businessName}
        description={`Referral ${l.referralCodeSnapshot} · Submitted ${new Date(l.submittedAt).toLocaleDateString("en-IN")}`}
        action={{ href: `/${a.role.toLowerCase()}/leads`, text: "All leads" }}
      />
      {l.duplicateFlag && (
        <div className="info-banner">
          This referral is under review. Our team will confirm the next steps.
        </div>
      )}
      <div className="detail-grid">
        <div>
          <section className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-title">
              <h2>Business details</h2>
              <Badge value={l.leadStatus} />
            </div>
            <dl className="detail-list">
              {[
                ["Contact", l.contactName],
                ["Phone", l.phone],
                ["WhatsApp", l.whatsapp],
                ["Email", l.email || "Not provided"],
                ["Category", l.category],
                ["Location", `${l.city}, ${l.state}`],
                ["Website", l.website || "Not provided"],
                ["Instagram", l.instagramUrl || "Not provided"],
                ["Services", l.services.join(", ")],
                ["Budget", l.budget],
                ["Preferred contact time", l.contactTime],
                ["Consent", "Confirmed at submission"],
                ...(admin
                  ? [["Assigned influencer", u?.name || "Account unavailable"]]
                  : []),
              ].map(([title, value]) => (
                <div key={title}>
                  <dt>{title}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <h3 style={{ marginTop: 30, fontSize: 16 }}>
              Current online presence
            </h3>
            <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
              {l.presence || "No details provided."}
            </p>
            <h3 style={{ fontSize: 16 }}>Referral notes</h3>
            <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
              {l.notes || "No notes provided."}
            </p>
            {l.visibleNote && (
              <div className="info-banner">
                <strong>Update from ScaleNex Digital</strong>
                <br />
                {l.visibleNote}
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>Status timeline</h2>
            </div>
            <ol className="timeline">
              {history.map((h) => (
                <li key={String(h._id)}>
                  <strong>{label(h.newStatus)}</strong>
                  <p>{h.reason || "Status updated by the team."}</p>
                  <small>{new Date(h.createdAt).toLocaleString("en-IN")}</small>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div>
          {admin ? (
            <LeadStatusForm
              id={id}
              status={l.leadStatus}
              visibleNote={l.visibleNote}
              internalNote={internalNote}
              duplicate={l.duplicateFlag}
            />
          ) : (
            <section className="panel">
              <div className="panel-title">
                <h2>Commission & payment</h2>
                <Badge value={l.paymentStatus} />
              </div>
              {payment ? (
                <>
                  <dl className="detail-list">
                    {[
                      ["Project value", money(payment.projectPaise)],
                      [
                        "Eligible client receipts",
                        money(payment.receivedPaise),
                      ],
                      ["Saved commission rate", payment.percentage + "%"],
                      ["Calculated commission", money(payment.calculatedPaise)],
                      ["Approved commission", money(payment.approvedPaise)],
                      [
                        "Transaction reference",
                        payment.transactionId || "Not recorded",
                      ],
                      ["Payment method", payment.method || "Not recorded"],
                      [
                        "Payment date",
                        payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString(
                              "en-IN",
                            )
                          : "Not recorded",
                      ],
                    ].map(([title, value]) => (
                      <div key={title}>
                        <dt>{title}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {payment.visibleNote && (
                    <p style={{ marginTop: 20, fontSize: 14 }}>
                      {payment.visibleNote}
                    </p>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 14 }}>
                  A commission record will appear when your admin records
                  eligible client payments.
                </p>
              )}
            </section>
          )}
        </div>
      </div>
      {admin && (
        <div style={{ marginTop: 25 }}>
          <PaymentForm id={id} initial={initial} tiers={plan} />
        </div>
      )}
    </>
  );
}
