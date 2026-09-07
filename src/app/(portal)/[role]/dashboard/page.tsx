import Link from "next/link";
import mongoose from "mongoose";
import { FileText, Users, Wallet, TrendingUp } from "lucide-react";
import { requireActor, ownerScope } from "@/lib/access";
import { Lead, User, Payment } from "@/lib/models";
import { leads } from "@/lib/queries";
import { money, label } from "@/lib/utils";
import { Heading, LeadTable } from "@/components/portal-server";
import { CopyCode, StatusChart } from "@/components/portal-widgets";
export default async function Dashboard() {
  const a = await requireActor();
  const admin = a.role === "ADMIN";
  const base = "/" + a.role.toLowerCase();
  const scope = admin
    ? {}
    : { influencerId: new mongoose.Types.ObjectId(a.id) };
  const [leadCounts, paymentCounts, totals, recent, userCount, activeCount] =
    await Promise.all([
      Lead.aggregate<{ _id: string; count: number }>([
        { $match: scope },
        { $group: { _id: "$leadStatus", count: { $sum: 1 } } },
      ]),
      Payment.aggregate<{ _id: string; count: number }>([
        { $match: scope },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Payment.aggregate<{
        estimated: number;
        approved: number;
        paid: number;
        pending: number;
      }>([
        { $match: scope },
        {
          $group: {
            _id: null,
            estimated: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["CANCELLED", "DISPUTED"]] },
                  0,
                  "$calculatedPaise",
                ],
              },
            },
            approved: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      ["COMMISSION_APPROVED", "PROCESSING", "PAID"],
                    ],
                  },
                  "$approvedPaise",
                  0,
                ],
              },
            },
            paid: {
              $sum: {
                $cond: [{ $eq: ["$status", "PAID"] }, "$approvedPaise", 0],
              },
            },
            pending: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["COMMISSION_APPROVED", "PROCESSING"]] },
                  "$approvedPaise",
                  0,
                ],
              },
            },
          },
        },
      ]),
      leads(a, {}),
      admin ? User.countDocuments({ role: "INFLUENCER" }) : Promise.resolve(0),
      admin
        ? User.countDocuments({ role: "INFLUENCER", status: "ACTIVE" })
        : Promise.resolve(0),
    ]);
  const counts = Object.fromEntries(leadCounts.map((c) => [c._id, c.count]));
  const total = leadCounts.reduce((s, c) => s + c.count, 0);
  const t = totals[0] || { estimated: 0, approved: 0, paid: 0, pending: 0 };
  const cards = admin
    ? [
        ["Total influencers", String(userCount), Users],
        ["Active influencers", String(activeCount), Users],
        ["Total leads", String(total), FileText],
        ["Converted leads", String(counts.WON || 0), TrendingUp],
        ["Estimated commission", money(t.estimated), Wallet],
        ["Approved commission", money(t.approved), Wallet],
        ["Paid commission", money(t.paid), Wallet],
        ["Pending payment", money(t.pending), Wallet],
      ]
    : [
        ["Total leads", String(total), FileText],
        ["New leads", String(counts.NEW || 0), FileText],
        ["Contacted leads", String(counts.CONTACTED || 0), FileText],
        ["Qualified leads", String(counts.QUALIFIED || 0), TrendingUp],
        ["Converted leads", String(counts.WON || 0), TrendingUp],
        ["Lost leads", String(counts.LOST || 0), FileText],
        ["Estimated commission", money(t.estimated), Wallet],
        ["Approved commission", money(t.approved), Wallet],
        ["Paid commission", money(t.paid), Wallet],
        ["Pending payment", money(t.pending), Wallet],
      ];
  void ownerScope;
  return (
    <>
      <Heading
        title={`Welcome back, ${a.name.split(" ")[0]}.`}
        description={
          admin
            ? "A clear view of your referral program."
            : "Your connections. Your progress. Your next opportunity."
        }
        action={
          admin
            ? { href: "/admin/influencers/new", text: "Add influencer" }
            : { href: "/influencer/leads/new", text: "Submit a lead" }
        }
      />
      <div className="stats-grid">
        {cards.map(([title, value, Icon], i) => {
          const I = Icon as typeof Users;
          return (
            <div className="stat-card" key={i}>
              <div className="stat-top">
                <span>{String(title)}</span>
                <I size={17} />
              </div>
              <strong>{String(value)}</strong>
              <small>All-time activity</small>
            </div>
          );
        })}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>Lead overview</h2>
            <span className="muted" style={{ fontSize: 11 }}>
              All time
            </span>
          </div>
          <StatusChart
            data={leadCounts.map((c) => ({
              name: label(c._id),
              count: c.count,
            }))}
          />
        </section>
        {admin ? (
          <section className="panel">
            <div className="panel-title">
              <h2>Payment overview</h2>
            </div>
            <StatusChart
              data={paymentCounts.map((c) => ({
                name: label(c._id),
                count: c.count,
              }))}
            />
          </section>
        ) : (
          <section className="panel referral-panel">
            <span className="eyebrow" style={{ color: "#aabbd6" }}>
              YOUR UNIQUE CONNECTION
            </span>
            <h2 style={{ fontSize: 25 }}>One code. Every opportunity.</h2>
            <p>
              Your referrals are attributed automatically when you submit a
              lead.
            </p>
            <CopyCode code={a.referralCode} />
            <small>Only your admin can change this code.</small>
          </section>
        )}
      </div>
      <section className="panel">
        <div className="panel-title">
          <h2>Recent leads</h2>
          <Link href={base + "/leads"}>View all leads →</Link>
        </div>
        <LeadTable rows={recent.rows.slice(0, 5)} base={base} />
      </section>
      {!admin && (
        <section className="panel" style={{ marginTop: 24 }}>
          <div className="panel-title">
            <h2>Payment overview</h2>
          </div>
          <StatusChart
            data={paymentCounts.map((c) => ({
              name: label(c._id),
              count: c.count,
            }))}
          />
        </section>
      )}
    </>
  );
}
