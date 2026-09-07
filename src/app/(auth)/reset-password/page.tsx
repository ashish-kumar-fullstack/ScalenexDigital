import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Choose a new password" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main id="main" className="auth-panel full-height">
      <div>
        <Brand />
        <h1 style={{ fontSize: 34, marginTop: 40 }}>A fresh start.</h1>
        <p>Choose a new password for your partner account.</p>
        <AuthForm mode="reset" token={token} />
      </div>
    </main>
  );
}
