import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Reset your password" };
export default function Page() {
  return (
    <main id="main" className="auth-panel full-height">
      <div>
        <Brand />
        <h1 style={{ fontSize: 34, marginTop: 40 }}>Forgot your password?</h1>
        <p>Enter your account email to request a secure reset link.</p>
        <AuthForm mode="forgot" />
      </div>
    </main>
  );
}
