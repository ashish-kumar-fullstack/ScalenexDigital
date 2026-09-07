import { Brand } from "@/components/brand";
import { RegisterForm } from "@/components/register-form";
export const metadata = {
  title: "Influencer registration",
  description:
    "Join the ScaleNex Digital referral program. Register your influencer account for review.",
};
export default function Page() {
  return (
    <main id="main" className="auth-page">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">GROW WITH SCALENEX DIGITAL</span>
          <h1>
            Your network.
            <br />
            <span>New possibilities.</span>
          </h1>
          <p>
            Register to become a referral partner. Once your account is
            approved, you can submit leads and track your commissions.
          </p>
        </div>
        <small>Build. Rank. Grow. Together.</small>
      </section>
      <section className="auth-panel">
        <div style={{ maxWidth: 550 }}>
          <span className="eyebrow">BECOME A REFERRAL PARTNER</span>
          <h1 style={{ fontSize: 34 }}>Create your account.</h1>
          <p>
            New registrations are reviewed by our admin team before sign-in is
            enabled.
          </p>
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
