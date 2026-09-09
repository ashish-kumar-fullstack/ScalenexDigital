import { Brand } from "@/components/brand";
import { RegisterForm } from "@/components/register-form";
export const metadata = {
  title: "Influencer registration",
  description:
    "Join the ScaleNex Digital referral program and create your influencer account.",
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
            Register to become a referral partner. Your account becomes active
            immediately so you can submit leads and track your commissions.
          </p>
        </div>
        <small>Build. Rank. Grow. Together.</small>
      </section>
      <section className="auth-panel">
        <div style={{ maxWidth: 550 }}>
          <span className="eyebrow">BECOME A REFERRAL PARTNER</span>
          <h1 style={{ fontSize: 34 }}>Create your account.</h1>
          <p>Create your account and sign in immediately after registration.</p>
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
