import { requireActor } from "@/lib/access";
import { leads, type Params } from "@/lib/queries";
import { leadStatuses } from "@/lib/constants";
import {
  Heading,
  FilterBar,
  LeadTable,
  Pagination,
} from "@/components/portal-server";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const a = await requireActor();
  const params = await searchParams;
  const data = await leads(a, params);
  const base = "/" + a.role.toLowerCase();
  return (
    <>
      <Heading
        title={a.role === "ADMIN" ? "All leads" : "My leads"}
        description="Every introduction, with a clear view of what comes next."
        action={
          a.role === "ADMIN"
            ? { href: "/api/export?type=leads", text: "Export CSV" }
            : { href: base + "/leads/new", text: "Submit a lead" }
        }
      />
      <section className="panel">
        <FilterBar statuses={leadStatuses} params={params} />
        <LeadTable rows={data.rows} base={base} />
        <Pagination {...data} params={params} />
      </section>
    </>
  );
}
