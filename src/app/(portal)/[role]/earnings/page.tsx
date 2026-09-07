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
  const a = await requireActor("payments:own");
  const params = await searchParams;
  const data = await payments(a, params);
  return (
    <>
      <Heading
        title="Your connections, rewarded."
        description="Follow your calculated commissions, approvals, and payments."
      />
      <div className="info-banner">
        Commissions are based on eligible client payments received. Open a lead
        to see its saved rate, payment details, and notes.
      </div>
      <section className="panel">
        <FilterBar statuses={paymentStatuses} params={params} search={false} />
        <PaymentTable rows={data.rows} base="/influencer" />
        <Pagination {...data} params={params} />
      </section>
    </>
  );
}
