import { requireActor } from "@/lib/access";
import { AuthForm } from "@/components/auth-form";
import { Heading } from "@/components/portal-server";
export default async function Page() {
  const a = await requireActor(undefined, true);
  return (
    <>
      <Heading
        title="Secure your account"
        description="Choose a private password to keep your workspace safe."
      />
      {a.mustChangePassword && (
        <div className="info-banner">
          Before continuing, replace the temporary password provided by your
          admin.
        </div>
      )}
      <div className="form-panel" style={{ maxWidth: 520 }}>
        <AuthForm mode="change" />
      </div>
    </>
  );
}
