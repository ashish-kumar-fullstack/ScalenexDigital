import Link from "next/link";
import { requireActor } from "@/lib/access";
import { users, type Params } from "@/lib/queries";
import {
  Heading,
  FilterBar,
  Pagination,
  Badge,
  Empty,
} from "@/components/portal-server";
import { userStatuses } from "@/lib/constants";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const a = await requireActor("users:manage");
  const params = await searchParams;
  const data = await users(a, params);
  return (
    <>
      <Heading
        title="Your referral partners"
        description="Manage the people helping your business grow."
        action={{ href: "/admin/influencers/new", text: "Add influencer" }}
      />
      <section className="panel">
        <FilterBar statuses={userStatuses} params={params} />
        {data.rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Referral code</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((u) => (
                  <tr key={String(u._id)}>
                    <td>
                      <Link href={"/admin/influencers/" + u._id}>{u.name}</Link>
                      <small>{u.email}</small>
                    </td>
                    <td>{u.referralCode}</td>
                    <td>{u.city}</td>
                    <td>
                      <Badge value={u.status} />
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                    <td>
                      <Link
                        className="text-link"
                        href={`/admin/influencers/${u._id}#status-update`}
                      >
                        Update status
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Your partner network starts here"
            text="Create an influencer account to invite your first referral partner."
          />
        )}
        <Pagination {...data} params={params} />
      </section>
    </>
  );
}
