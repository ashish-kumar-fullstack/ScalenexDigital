import Link from "next/link";
import { requireActor } from "@/lib/access";
import { commissionTiers } from "@/lib/workflows";
import { Heading } from "@/components/portal-server";
import { RulesForm } from "@/components/portal-forms";
export default async function Page() {
  await requireActor("settings:manage");
  return (
    <>
      <Heading
        title="Program settings"
        description="Manage commission rules without changing historical payment snapshots."
      />
      <RulesForm tiers={await commissionTiers()} />
      <section className="panel">
        <h2 style={{ fontSize: 21 }}>Account security</h2>
        <p style={{ fontSize: 14 }}>
          Changing your password signs out all existing sessions.
        </p>
        <Link className="button button-outline" href="/admin/change-password">
          Change admin password
        </Link>
      </section>
    </>
  );
}
