"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { contactSchema, type ContactResult } from "@/lib/contact-schema";
import { serviceNames } from "@/lib/constants";
import { submitContact } from "@/app/contact-actions";
import { Button } from "./ui/button";

export function ContactForm() {
  const [result, setResult] = useState<ContactResult | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof contactSchema>,
    unknown,
    z.output<typeof contactSchema>
  >({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      business: "",
      service: "Website development",
      message: "",
      website: "",
    },
  });
  return (
    <form
      className="form-stack"
      noValidate
      onSubmit={handleSubmit(async (data) => {
        setResult(null);
        try {
          const response = await submitContact(data);
          setResult(response);
          if (response.ok) reset();
        } catch {
          setResult({
            ok: false,
            message:
              "We couldn’t connect. Please try again or email scalenexdigital@gmail.com.",
          });
        }
      })}
    >
      <div className="form-grid">
        {(
          [
            ["name", "Your name", "text", "name"],
            ["email", "Email address", "email", "email"],
            ["phone", "Phone number (optional)", "tel", "tel"],
            ["business", "Business name (optional)", "text", "organization"],
          ] as const
        ).map(([name, title, type, autoComplete]) => (
          <div className="field" key={name}>
            <label htmlFor={`contact-${name}`}>{title}</label>
            <input
              id={`contact-${name}`}
              type={type}
              autoComplete={autoComplete}
              {...register(name)}
              required={name === "name" || name === "email"}
              aria-invalid={!!errors[name]}
              aria-describedby={
                errors[name] ? `contact-${name}-error` : undefined
              }
            />
            {errors[name] && (
              <small id={`contact-${name}-error`} className="field-error">
                {errors[name]?.message}
              </small>
            )}
          </div>
        ))}
      </div>
      <div className="field">
        <label htmlFor="contact-service">What can we help with?</label>
        <select id="contact-service" {...register("service")}>
          {serviceNames.map((service) => (
            <option key={service}>{service}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="contact-message">Tell us about your project</label>
        <textarea
          id="contact-message"
          rows={5}
          maxLength={5000}
          required
          placeholder="Your goals, challenges, or the idea you’d like to explore…"
          {...register("message")}
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
        />
        {errors.message && (
          <small id="contact-message-error" className="field-error">
            {errors.message.message}
          </small>
        )}
      </div>
      <div hidden aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>
      <div>
        <label className="check-field">
          <input
            type="checkbox"
            {...register("consent")}
            aria-invalid={!!errors.consent}
          />
          I agree to be contacted by ScaleNex Digital about my enquiry.
        </label>
        {errors.consent && (
          <p style={{ color: "#9b3430", fontSize: 13, margin: "8px 0 0" }}>
            {errors.consent.message}
          </p>
        )}
        <Link
          href="/privacy-policy"
          style={{ fontSize: 13, color: "var(--blue)" }}
        >
          Read our privacy policy
        </Link>
      </div>
      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`form-status${result.ok ? "" : " error"}`}
        >
          {result.message}
          {!result.ok && (
            <>
              <br />
              <a
                href="mailto:scalenexdigital@gmail.com"
                style={{ textDecoration: "underline" }}
              >
                Email us directly
              </a>
            </>
          )}
        </div>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending enquiry…" : "Send enquiry"}
        <ArrowUpRight size={18} />
      </Button>
    </form>
  );
}
