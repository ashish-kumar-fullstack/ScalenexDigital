import { requireActor } from "@/lib/access";
import { auditRows, type Params } from "@/lib/queries";
import { Heading, Pagination, Empty } from "@/components/portal-server";
import { label } from "@/lib/utils";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const a = await requireActor("audit:read");
  const params = await searchParams;
  const data = await auditRows(a, params);
  return (
    <>
      <Heading
        title="Audit trail"
        description="Account, lead, and financial changes with actor and reason."
      />
      <section className="panel">
        {data.rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Record</th>
                  <th>Reason</th>
                  <th>Time</th>
                  <th>Change details</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={String(r._id)}>
                    <td>{label(r.action)}</td>
                    <td>
                      {r.role}
                      <small>{String(r.actor)}</small>
                    </td>
                    <td>
                      {r.entityType}
                      <small>{String(r.entityId)}</small>
                    </td>
                    <td style={{ whiteSpace: "normal", minWidth: 180 }}>
                      {r.reason}
                    </td>
                    <td>{new Date(r.createdAt).toLocaleString("en-IN")}</td>
                    <td>
                      <details>
                        <summary>View change</summary>
                        <pre style={{ maxWidth: 400, whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(
                            { before: r.previousData, after: r.newData },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No audit events yet"
            text="Protected changes will be recorded here automatically."
          />
        )}
        <Pagination {...data} params={params} />
      </section>
    </>
  );
}
