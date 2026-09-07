"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/lib/register-schema";
import { submitRegistration } from "@/app/register-actions";
import { Button } from "./ui/button";
export function RegisterForm() {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof registerSchema>,
    unknown,
    z.output<typeof registerSchema>
  >({ resolver: zodResolver(registerSchema), defaultValues: { website: "" } });
  if (result?.ok)
    return (
      <div className="form-stack">
        <div className="form-status" role="status">
          {result.message}
        </div>
        <Button asChild>
          <Link href="/login">Go to sign in</Link>
        </Button>
        <Link className="text-link" href="/contact">
          Contact the team →
        </Link>
      </div>
    );
  return (
    <form
      className="form-stack"
      noValidate
      onSubmit={handleSubmit(async (data) => {
        setResult(null);
        try {
          setResult(await submitRegistration(data));
        } catch {
          setResult({
            ok: false,
            message: "Unable to connect. Please try again.",
          });
        }
      })}
    >
      <div className="form-grid">
        {(
          [
            ["name", "Full name", "text", "name"],
            ["email", "Email address", "email", "email"],
            ["phone", "Phone number", "tel", "tel"],
            ["instagram", "Instagram handle", "text", "off"],
            ["city", "City", "text", "address-level2"],
            ["state", "State", "text", "address-level1"],
            ["password", "Password", "password", "new-password"],
            ["confirmPassword", "Confirm password", "password", "new-password"],
          ] as const
        ).map(([name, title, type, autocomplete]) => (
          <div className="field" key={name}>
            <label htmlFor={`register-${name}`}>{title}</label>
            <input
              id={`register-${name}`}
              type={type}
              autoComplete={autocomplete}
              required
              {...register(name)}
              aria-invalid={!!errors[name]}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
            {errors[name] && (
              <small className="field-error" id={`${name}-error`}>
                {errors[name]?.message}
              </small>
            )}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, margin: 0 }}>
        Use a unique password with at least 12 characters. Your referral code
        and standard commission plan are assigned automatically.
      </p>
      <div hidden aria-hidden="true">
        <label htmlFor="register-website">Leave empty</label>
        <input
          id="register-website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>
      <div>
        <label className="check-field">
          <input type="checkbox" {...register("consent")} />I agree to the terms
          of the influencer program and the privacy policy.
        </label>
        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 13,
            color: "var(--blue)",
          }}
        >
          <Link href="/terms">Terms of service</Link>
          <Link href="/privacy-policy">Privacy policy</Link>
        </div>
        {errors.consent && (
          <p style={{ fontSize: 13, color: "#9b3430" }}>
            {errors.consent.message}
          </p>
        )}
      </div>
      {result && (
        <div role="status" className="form-status error">
          {result.message}
        </div>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating your account…" : "Register as an influencer"}
      </Button>
      <p style={{ fontSize: 14, margin: 0 }}>
        Already a partner?{" "}
        <Link className="text-link" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
