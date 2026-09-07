import { beforeEach, describe, expect, it, vi } from "vitest";
const { sendMail, createTransport, throttle } = vi.hoisted(() => ({ sendMail: vi.fn(), createTransport: vi.fn(), throttle: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport } }));
vi.mock("../../src/lib/security", () => ({ rateLimit: throttle }));
import { deliverContact } from "../../src/lib/contact-mail";
const form = { name: "Test Visitor", email: "visitor@example.test", phone: "", business: "", service: "SEO", message: "Please help with our website visibility.", consent: true, website: "" };
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SMTP_HOST", "smtp.example.test");
  vi.stubEnv("SMTP_PORT", "587");
  vi.stubEnv("SMTP_USER", "test");
  vi.stubEnv("SMTP_PASSWORD", "test-only");
  vi.stubEnv("EMAIL_FROM", "ScaleNex Digital <sender@example.test>");
  createTransport.mockReturnValue({ sendMail });
  sendMail.mockResolvedValue({ accepted: ["scalenexdigital@gmail.com"] });
});
describe("contact delivery", () => {
  it("sends only to the agency with the visitor as reply-to", async () => {
    expect((await deliverContact(form)).ok).toBe(true);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "scalenexdigital@gmail.com", replyTo: "visitor@example.test", from: "ScaleNex Digital <sender@example.test>" }));
    expect(throttle).toHaveBeenCalledTimes(2);
  });
  it("rejects recipient injection, invalid inputs, and missing consent", async () => {
    for (const input of [{ ...form, to: "attacker@example.test" }, { ...form, consent: false }, { ...form, website: "spam" }, { ...form, email: "invalid" }]) expect((await deliverContact(input)).ok).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
  it("does not claim success when SMTP is missing", async () => {
    vi.stubEnv("SMTP_PASSWORD", "");
    expect((await deliverContact(form)).ok).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
  it("handles rejection and SMTP failures without leaking details", async () => {
    sendMail.mockResolvedValueOnce({ accepted: [] });
    expect((await deliverContact(form)).ok).toBe(false);
    sendMail.mockRejectedValueOnce(new Error("private-provider-detail"));
    const response = await deliverContact(form);
    expect(response.ok).toBe(false);
    expect(response.message).not.toContain("private-provider-detail");
  });
  it("blocks email delivery when throttled", async () => {
    throttle.mockRejectedValueOnce(new Error("Rate limit"));
    expect((await deliverContact(form)).ok).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
});
