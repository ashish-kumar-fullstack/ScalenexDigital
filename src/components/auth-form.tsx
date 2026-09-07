"use client";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@/lib/validation";
import {
  afterLogin,
  changePassword,
  forgotPassword,
  resetPassword,
} from "@/app/actions";
import { Button } from "./ui/button";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
export function AuthForm({
  mode = "login",
  token = "",
}: {
  mode?: "login" | "forgot" | "reset" | "change";
  token?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: mode === "login" ? zodResolver(loginSchema) : undefined,
  });
  async function submit(data: z.infer<typeof loginSchema>) {
    setBusy(true);
    setResult(null);
    if (mode === "login") {
      try {
        const r = await signIn("credentials", { ...data, redirect: false });
        if (r?.error)
          setResult({
            ok: false,
            message:
              "Unable to sign in. Check your details or contact the admin team.",
          });
        else await afterLogin();
      } catch {
        setResult({
          ok: false,
          message: "Unable to sign in. Please try again.",
        });
      }
    } else if (mode === "forgot") setResult(await forgotPassword(data.email));
    else if (mode === "reset")
      setResult(await resetPassword({ token, password: data.password }));
    else {
      const r = await changePassword({
        current: data.email,
        password: data.password,
      });
      setResult(r);
      if (r.ok) await signOut({ callbackUrl: "/login?changed=1" });
    }
    setBusy(false);
  }
  return (
    <>
      <form onSubmit={handleSubmit(submit)} className="form-stack">
        {mode !== "reset" && (
          <div className="field">
            <label htmlFor="email">
              {mode === "change" ? "Current password" : "Email address"}
            </label>
            <input
              id="email"
              type={mode === "change" ? "password" : "email"}
              autoComplete={mode === "change" ? "current-password" : "email"}
              required
              placeholder={
                mode === "change" ? "Your current password" : "you@example.com"
              }
              {...register("email")}
            />
            {errors.email && (
              <small className="field-error">{errors.email.message}</small>
            )}
          </div>
        )}
        {mode !== "forgot" && (
          <div className="field">
            <label htmlFor="password">
              {mode === "login" ? "Password" : "New password"}
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "login" ? 1 : 12}
                maxLength={72}
                required
                {...register("password")}
              />
              <button
                type="button"
                className="button button-outline"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
                style={{ padding: 10 }}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode !== "login" && (
              <small>
                Use 12–72 characters. Choose a password you don’t use elsewhere.
              </small>
            )}
            {errors.password && (
              <small className="field-error">{errors.password.message}</small>
            )}
          </div>
        )}
        {result && (
          <div
            role="status"
            className={"form-status" + (!result.ok ? " error" : "")}
          >
            {result.message}
          </div>
        )}
        <Button disabled={busy} type="submit">
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in to your workspace"
              : mode === "forgot"
                ? "Send reset link"
                : "Update password"}
          <ArrowUpRight size={18} />
        </Button>
      </form>
      <div className="auth-links">
        {mode === "login" ? (
          <>
            <span>Secure partner access</span>
            <Link href="/forgot-password">Forgot password?</Link>
          </>
        ) : (
          <Link href="/login">Back to sign in</Link>
        )}
      </div>
    </>
  );
}
