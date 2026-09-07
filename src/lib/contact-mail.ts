import "server-only";
import nodemailer from "nodemailer";
import { contactSchema, type ContactResult } from "./contact-schema";
import { rateLimit } from "./security";

const recipient = "scalenexdigital@gmail.com";

export async function deliverContact(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the form and complete all required fields." };
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.EMAIL_FROM) {
    return { ok: false, message: "The contact form is temporarily unavailable. Please email scalenexdigital@gmail.com directly." };
  }
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { ok: false, message: "The contact form is temporarily unavailable. Please email us directly." };
  const v = parsed.data;
  try {
    await rateLimit("contact-global", 100, 3600);
    await rateLimit("contact-email:" + v.email, 5, 3600);
  } catch {
    return { ok: false, message: "We couldn’t submit your enquiry right now. Please try again later or email us directly." };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipient,
      replyTo: v.email,
      subject: `Website enquiry: ${v.service}`,
      text: [
        "New enquiry from the ScaleNex Digital website", "",
        `Name: ${v.name}`, `Email: ${v.email}`, `Phone: ${v.phone || "Not provided"}`,
        `Business: ${v.business || "Not provided"}`, `Interested service: ${v.service}`,
        "", "Message:", v.message, "", "Customer agreed to be contacted about this enquiry.",
      ].join("\n"),
    });
    if (!info.accepted?.some(address => String(address).toLowerCase() === recipient)) throw new Error("Email not accepted");
    return { ok: true, message: "Thank you! Your enquiry has been sent. Our team will get back to you by email." };
  } catch {
    return { ok: false, message: "Your enquiry wasn’t sent. Please try again later or email scalenexdigital@gmail.com directly." };
  }
}
