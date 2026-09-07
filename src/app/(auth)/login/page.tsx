import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Partner login" };
export default function Login() {
  return (
    <main id="main" className="auth-page">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">THE SCALENEX DIGITAL PARTNER PORTAL</span>
          <h1>
            Good connections.
            <br />
            <span>Shared growth.</span>
          </h1>
          <p>
            Your leads, progress, and earnings.
            <br />
            One clear place to keep moving forward.
          </p>
        </div>
        <small>Build. Rank. Grow. Together.</small>
      </section>
      <section className="auth-panel">
        <div>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>
            Your next opportunity
            <br />
            starts here.
          </h2>
          <p>Sign in to your ScaleNex Digital workspace.</p>
          <AuthForm />
          <p className="auth-note">
            New to our influencer program?{" "}
            <Link className="text-link" href="/register">
              Create your account ↗
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
