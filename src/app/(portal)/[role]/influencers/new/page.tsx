import { requireActor } from "@/lib/access";
import { Heading } from "@/components/portal-server";
import { UserForm } from "@/components/portal-forms";
export default async function Page() {
  await requireActor("users:manage");
  return (
    <>
      <Heading
        title="Welcome a new partner"
        description="Create a private account. A unique referral code is generated automatically."
      />
      <UserForm />
    </>
  );
}
