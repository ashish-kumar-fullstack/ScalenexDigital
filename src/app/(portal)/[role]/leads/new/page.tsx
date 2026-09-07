import { requireActor } from "@/lib/access";
import { Heading } from "@/components/portal-server";
import { LeadForm } from "@/components/portal-forms";
export default async function Page() {
  const a = await requireActor("leads:create");
  return (
    <>
      <Heading
        title="Make a new connection."
        description="Share a business that’s ready to explore its next digital step."
      />
      <LeadForm code={a.referralCode} />
    </>
  );
}
