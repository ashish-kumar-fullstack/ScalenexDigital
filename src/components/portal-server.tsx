import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { label, money } from "@/lib/utils";
import type { LeadRow, PaymentRow, Params } from "@/lib/queries";
import { Button } from "./ui/button";
export function Badge({ value }: { value: string }) {
  return (
    <span className={"badge badge-" + value.toLowerCase()}>{label(value)}</span>
  );
}
export function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; text: string };
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <Button asChild size="sm">
          <Link href={action.href}>
            {action.text}
            <ArrowUpRight size={16} />
          </Link>
        </Button>
      )}
    </div>
  );
}
export function FilterBar({
  statuses,
  params,
  search = true,
}: {
  statuses: readonly string[];
  params: Params;
  search?: boolean;
}) {
  return (
    <form className="filter-bar">
      {search && (
        <input
          name="q"
          aria-label="Search by name"
          placeholder="Search by name…"
          defaultValue={typeof params.q === "string" ? params.q : ""}
        />
      )}
      <select
        name="status"
        aria-label="Filter by status"
        defaultValue={typeof params.status === "string" ? params.status : ""}
      >
        <option value="">All statuses</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {label(s)}
          </option>
        ))}
      </select>
      <label>
        From{" "}
        <input
          name="from"
          type="date"
          defaultValue={typeof params.from === "string" ? params.from : ""}
        />
      </label>
      <label>
        To{" "}
        <input
          name="to"
          type="date"
          defaultValue={typeof params.to === "string" ? params.to : ""}
        />
      </label>
      <Button variant="outline" size="sm" type="submit">
        Apply filters
      </Button>
    </form>
  );
}
export function Pagination({
  page,
  total,
  params,
}: {
  page: number;
  total: number;
  params: Params;
}) {
  function href(n: number) {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      if (typeof value === "string") q.set(key, value);
    q.set("page", String(n));
    return "?" + q;
  }
  return (
    <div className="pagination">
      <span>
        {total} records · Page {page} of {Math.max(1, Math.ceil(total / 20))}
      </span>
      <div>
        {page > 1 && <Link href={href(page - 1)}>← Previous</Link>}
        {page * 20 < total && <Link href={href(page + 1)}>Next →</Link>}
      </div>
    </div>
  );
}
export function LeadTable({ rows, base }: { rows: LeadRow[]; base: string }) {
  if (!rows.length)
    return (
      <Empty
        title="No leads to show"
        text="New referrals and their progress will appear here."
      />
    );
  return (
    <div className="responsive-records">
      <div className="mobile-records">
        {rows.map((l) => (
          <article key={String(l._id)} className="mobile-record">
            <Link href={`${base}/leads/${l._id}`}>
              <strong>{l.businessName}</strong>
              <ArrowUpRight size={18} />
            </Link>
            <p>
              {l.contactName} · {l.city}
            </p>
            <div>
              <Badge value={l.leadStatus} />
              <Badge value={l.paymentStatus} />
            </div>
            {l.duplicateFlag && <small>Under review</small>}
            <small>
              Submitted {new Date(l.submittedAt).toLocaleDateString("en-IN")}
            </small>
          </article>
        ))}
      </div>
      <div className="table-wrap desktop-records">
        <table>
          <thead>
            <tr>
              <th>Business / contact</th>
              <th>Service location</th>
              <th>Lead status</th>
              <th>Payment status</th>
              <th>Submitted</th>
              <th>
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={String(l._id)}>
                <td>
                  <Link href={`${base}/leads/${l._id}`}>{l.businessName}</Link>
                  <small>{l.contactName}</small>
                </td>
                <td>{l.city}</td>
                <td>
                  <Badge value={l.leadStatus} />
                  {l.duplicateFlag && <small>Under review</small>}
                </td>
                <td>
                  <Badge value={l.paymentStatus} />
                </td>
                <td>{new Date(l.submittedAt).toLocaleDateString("en-IN")}</td>
                <td>
                  <Link
                    aria-label={"Open " + l.businessName}
                    href={`${base}/leads/${l._id}`}
                  >
                    <ArrowUpRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function PaymentTable({
  rows,
  base,
}: {
  rows: PaymentRow[];
  base: string;
}) {
  if (!rows.length)
    return (
      <Empty
        title="No payment records yet"
        text="Commission records will appear after eligible client payments are recorded."
      />
    );
  return (
    <div className="responsive-records">
      <div className="mobile-records">
        {rows.map((p) => (
          <article key={String(p._id)} className="mobile-record">
            <Link href={`${base}/leads/${p.leadId}`}>
              <strong>{p.referralCodeSnapshot}</strong>
              <ArrowUpRight size={18} />
            </Link>
            <p>
              Approved commission: <strong>{money(p.approvedPaise)}</strong>
            </p>
            <div>
              <Badge value={p.status} />
              <span>{p.percentage}% saved rate</span>
            </div>
            <small>
              Calculated: {money(p.calculatedPaise)} · Client received:{" "}
              {money(p.receivedPaise)}
            </small>
          </article>
        ))}
      </div>
      <div className="table-wrap desktop-records">
        <table>
          <thead>
            <tr>
              <th>Referral / lead</th>
              <th>Project value</th>
              <th>Client received</th>
              <th>Rate</th>
              <th>Calculated</th>
              <th>Approved</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={String(p._id)}>
                <td>
                  <Link href={`${base}/leads/${p.leadId}`}>
                    {p.referralCodeSnapshot}
                  </Link>
                  <small>{String(p.leadId).slice(-8).toUpperCase()}</small>
                </td>
                <td>{money(p.projectPaise)}</td>
                <td>{money(p.receivedPaise)}</td>
                <td>{p.percentage}%</td>
                <td>{money(p.calculatedPaise)}</td>
                <td>{money(p.approvedPaise)}</td>
                <td>
                  <Badge value={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <FileText size={28} />
      <h3>{title}</h3>
      <p style={{ fontSize: 13, marginBottom: 0 }}>{text}</p>
    </div>
  );
}
