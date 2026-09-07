import { requireActor } from "@/lib/access";
import { Lead, Payment, User } from "@/lib/models";
import { filters, auditRows, type Params } from "@/lib/queries";
import { Heading, Empty } from "@/components/portal-server";
import { StatusChart } from "@/components/portal-widgets";
import { money, label } from "@/lib/utils";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const a = await requireActor("audit:read");
  const params = await searchParams;
  const f = filters(params);
  const from = f.from
    ? new Date(f.from)
    : new Date(new Date().getTime() - 30 * 86400000);
  const to = f.to ? new Date(f.to + "T23:59:59.999Z") : new Date();
  const span = Math.max(86400000, to.getTime() - from.getTime());
  const dateFilter = { submittedAt: { $gte: from, $lte: to } };
  const [
    counts,
    top,
    total,
    previous,
    financial,
    activity,
    active,
    totalUsers,
  ] = await Promise.all([
    Lead.aggregate<{ _id: string; count: number }>([
      { $match: dateFilter },
      { $group: { _id: "$leadStatus", count: { $sum: 1 } } },
    ]),
    Lead.aggregate<{ _id: string; name: string; count: number; won: number }>([
      { $match: dateFilter },
      {
        $group: {
          _id: "$influencerId",
          count: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ["$leadStatus", "WON"] }, 1, 0] } },
        },
      },
      { $sort: { won: -1, count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          count: 1,
          won: 1,
          name: { $arrayElemAt: ["$user.name", 0] },
        },
      },
    ]),
    Lead.countDocuments(dateFilter),
    Lead.countDocuments({
      submittedAt: { $gte: new Date(from.getTime() - span), $lt: from },
    }),
    Payment.aggregate<{
      project: number;
      clientPending: number;
      commissionPending: number;
      paid: number;
    }>([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: null,
          project: { $sum: "$projectPaise" },
          clientPending: {
            $sum: {
              $max: [0, { $subtract: ["$projectPaise", "$receivedPaise"] }],
            },
          },
          commissionPending: {
            $sum: {
              $cond: [
                { $in: ["$status", ["COMMISSION_APPROVED", "PROCESSING"]] },
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
        },
      },
    ]),
    auditRows(a, {}),
    User.countDocuments({ role: "INFLUENCER", status: "ACTIVE" }),
    User.countDocuments({ role: "INFLUENCER" }),
  ]);
  const t = financial[0] || {
    project: 0,
    clientPending: 0,
    commissionPending: 0,
    paid: 0,
  };
  const won = counts.find((c) => c._id === "WON")?.count || 0;
  return (
    <>
      <Heading
        title="A clearer picture of growth"
        description="Real program activity, scoped to your selected period."
      />
      <form className="filter-bar">
        <label>
          From
          <input
            type="date"
            name="from"
            defaultValue={from.toISOString().slice(0, 10)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            name="to"
            defaultValue={to.toISOString().slice(0, 10)}
          />
        </label>
        <button className="button button-outline button-sm">
          Update report
        </button>
      </form>
      <div className="stats-grid">
        {[
          ["Total influencers", String(totalUsers)],
          ["Active influencers", String(active)],
          ["Leads in period", String(total)],
          ["Previous equal period", String(previous)],
          ["Converted project value", money(t.project)],
          ["Pending client receipts", money(t.clientPending)],
          ["Pending commission", money(t.commissionPending)],
          ["Paid commission", money(t.paid)],
        ].map(([h, v]) => (
          <div className="stat-card" key={h}>
            <span className="stat-top">{h}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>Leads by status</h2>
          </div>
          <StatusChart
            data={counts.map((c) => ({ name: label(c._id), count: c.count }))}
          />
        </section>
        <section className="panel">
          <h2 style={{ fontSize: 18 }}>Conversion snapshot</h2>
          <p>
            {won} won of {total} submitted leads in this period.
          </p>
          <strong style={{ fontSize: 42 }}>
            {total ? ((won / total) * 100).toFixed(1) : "0"}%
          </strong>
          <p style={{ fontSize: 13 }}>
            Current-state conversion. Status history is retained on each lead.
          </p>
          <StatusChart
            data={[
              "NEW",
              "CONTACTED",
              "QUALIFIED",
              "PROPOSAL_SENT",
              "NEGOTIATION",
              "WON",
            ].map((s) => ({
              name: label(s),
              count: counts.find((c) => c._id === s)?.count || 0,
            }))}
          />
        </section>
      </div>
      <section className="panel">
        <div className="panel-title">
          <h2>Top-performing influencers</h2>
          <span style={{ fontSize: 11 }}>
            Ranked by won leads, then total referrals
          </span>
        </div>
        {top.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Influencer</th>
                  <th>Leads</th>
                  <th>Won</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r) => (
                  <tr key={String(r._id)}>
                    <td>{r.name}</td>
                    <td>{r.count}</td>
                    <td>{r.won}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No activity in this period"
            text="Partner performance appears when leads are submitted."
          />
        )}
      </section>
      <section className="panel" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Recent admin activity</h2>
        {activity.rows.slice(0, 6).map((r) => (
          <p style={{ fontSize: 13 }} key={String(r._id)}>
            {label(r.action)} · {new Date(r.createdAt).toLocaleString("en-IN")}
          </p>
        ))}
      </section>
    </>
  );
}
