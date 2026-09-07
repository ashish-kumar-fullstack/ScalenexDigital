import { NextResponse } from "next/server";
import { requireActor } from "@/lib/access";
import { Lead, Payment } from "@/lib/models";
import { rateLimit } from "@/lib/security";
import type { LeadRow, PaymentRow } from "@/lib/queries";
export const dynamic = "force-dynamic";
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return (
    '"' +
    (/^[=+\-@\t\r\n]/.test(text) ? "'" : "") +
    text.replaceAll('"', '""') +
    '"'
  );
}
export async function GET(request: Request) {
  const a = await requireActor("audit:read");
  await rateLimit("export:" + a.id, 10, 3600);
  const type = new URL(request.url).searchParams.get("type");
  if (!["leads", "payments"].includes(type || ""))
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  let rows: unknown[][];
  if (type === "leads") {
    const data = await Lead.find({})
      .sort({ _id: 1 })
      .limit(10001)
      .lean<LeadRow[]>();
    if (data.length > 10000)
      return NextResponse.json(
        { error: "Export exceeds 10,000 records. Request an offline export." },
        { status: 422 },
      );
    rows = [
      [
        "Business",
        "Contact",
        "Phone",
        "Email",
        "City",
        "Referral code",
        "Lead status",
        "Payment status",
        "Submitted",
      ],
      ...data.map((l) => [
        l.businessName,
        l.contactName,
        l.phone,
        l.email,
        l.city,
        l.referralCodeSnapshot,
        l.leadStatus,
        l.paymentStatus,
        l.submittedAt.toISOString(),
      ]),
    ];
  } else {
    const data = await Payment.find({})
      .sort({ _id: 1 })
      .limit(10001)
      .lean<PaymentRow[]>();
    if (data.length > 10000)
      return NextResponse.json(
        { error: "Export exceeds 10,000 records. Request an offline export." },
        { status: 422 },
      );
    rows = [
      [
        "Lead ID",
        "Referral code",
        "Project (paise)",
        "Client received (paise)",
        "Rate (%)",
        "Calculated (paise)",
        "Approved (paise)",
        "Status",
        "Transaction ID",
      ],
      ...data.map((p) => [
        p.leadId,
        p.referralCodeSnapshot,
        p.projectPaise,
        p.receivedPaise,
        p.percentage,
        p.calculatedPaise,
        p.approvedPaise,
        p.status,
        p.transactionId,
      ]),
    ];
  }
  return new Response(
    "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="scalenex-${type}.csv"`,
        "Cache-Control": "private, no-store",
      },
    },
  );
}
