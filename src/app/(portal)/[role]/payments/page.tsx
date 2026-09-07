import { requireActor } from "@/lib/access";
import { payments, type Params } from "@/lib/queries";
import { paymentStatuses } from "@/lib/constants";
import {
  Heading,
  FilterBar,
  PaymentTable,
  Pagination,
} from "@/components/portal-server";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const a = await requireActor("payments:manage");
  const params = await searchParams;
  const data = await payments(a, params);
  return (
    <>
      <Heading
        title="Payments & commissions"
        description="Client receipts, commission snapshots, and partner payouts."
        action={{ href: "/api/export?type=payments", text: "Export CSV" }}
      />
      <section className="panel">
        <FilterBar statuses={paymentStatuses} params={params} search={false} />
        <PaymentTable rows={data.rows} base="/admin" />
        <Pagination {...data} params={params} />
      </section>
    </>
  );
}
