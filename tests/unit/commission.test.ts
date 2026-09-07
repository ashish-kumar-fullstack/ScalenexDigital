import { describe, it, expect } from "vitest";
import {
  calculateCommission,
  rupeesToPaise,
  defaultTiers,
} from "../../src/lib/commission";
import { leadSchema, normalizeLead } from "../../src/lib/validation";
import { referralCode } from "../../src/lib/security";
import { allowed } from "../../src/lib/constants";
describe("integer money and commission boundaries", () => {
  it.each([
    [1999999, 100000, 20, 20000],
    [2000000, 100000, 30, 30000],
    [3999999, 100000, 30, 30000],
    [4000000, 100000, 40, 40000],
    [5000000, 0, 40, 0],
  ])("project %i receives %i", (project, received, rate, result) => {
    expect(calculateCommission(project, received)).toEqual({
      percentage: rate,
      calculatedPaise: result,
    });
  });
  it("rounds fractions safely", () =>
    expect(calculateCommission(1, 1)).toEqual({
      percentage: 20,
      calculatedPaise: 0,
    }));
  it("rejects unsafe, negative, and excess receipts", () => {
    for (const [p, r] of [
      [-1, 0],
      [2, 3],
      [1.1, 1],
      [Number.MAX_SAFE_INTEGER, 0],
    ])
      expect(() => calculateCommission(p, r)).toThrow();
  });
  it("parses decimal input exactly", () => {
    expect(rupeesToPaise("19999.99")).toBe(1999999);
    expect(rupeesToPaise("0.01")).toBe(1);
    expect(() => rupeesToPaise("1.001")).toThrow();
  });
  it("retains an already-calculated snapshot", () => {
    const snapshot = calculateCommission(2000000, 100000);
    const changed = defaultTiers.map((t) => ({ ...t, percentage: 10 }));
    expect(calculateCommission(2000000, 100000, changed).percentage).toBe(10);
    expect(snapshot.percentage).toBe(30);
  });
});
describe("permissions and attribution", () => {
  it("uses exactly scoped permissions", () => {
    expect(allowed("ADMIN", "users:manage")).toBe(true);
    for (const p of [
      "users:manage",
      "leads:update",
      "payments:manage",
      "audit:read",
    ])
      expect(allowed("INFLUENCER", p)).toBe(false);
  });
  it("creates unpredictable uppercase referral codes", () => {
    const values = Array.from({ length: 2000 }, () => referralCode("Rahul"));
    expect(new Set(values).size).toBe(values.length);
    expect(values[0]).toMatch(/^SNX-RAHUL-[A-F0-9]{10}$/);
  });
  it("rejects forged ownership fields", () => {
    expect(
      leadSchema.safeParse({
        influencerId: "forged",
        referralCode: "SNX-OTHER",
        leadStatus: "WON",
      }).success,
    ).toBe(false);
  });
  it("normalizes duplicate signals", () => {
    const v = {
      businessName: "Acme & Co.",
      phone: "+91 98765 43210",
      email: "TEST@EXAMPLE.COM",
      website: "https://www.example.com/path",
    };
    const norm = normalizeLead(v as Parameters<typeof normalizeLead>[0]);
    expect(norm).toEqual({
      normalizedBusiness: "acmeco",
      normalizedPhone: "919876543210",
      normalizedEmail: "test@example.com",
      normalizedDomain: "example.com",
    });
  });
});
