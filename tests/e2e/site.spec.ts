import { test, expect } from "@playwright/test";
async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("BrowserTest!1234");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
}
test("public pages render and consultation is usable", async ({ page }) => {
  for (const path of [
    "/",
    "/about",
    "/services",
    "/services/seo",
    "/services/website-development",
    "/services/social-media-marketing",
    "/services/google-ads",
    "/services/meta-ads",
    "/services/ugc-ads",
    "/services/ai-automation",
    "/services/custom-software",
    "/projects",
    "/reviews",
    "/influencer-program",
    "/contact",
    "/privacy-policy",
    "/terms",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/");
  await page
    .getByRole("link", { name: "Book a Free Consultation" })
    .first()
    .click();
  await expect(page).toHaveURL(/contact/);
  await expect(
    page.getByRole("button", { name: "Send enquiry" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Enter your name.", {exact: true})).toBeVisible();
});
test("mobile navigation fits and routes work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Services", exact: true })
    .click();
  await expect(page).toHaveURL(/services/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("anonymous portal access redirects to login", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/login/);
  await page.goto("/influencer/dashboard");
  await expect(page).toHaveURL(/login/);
});
test("active partner logs in, cannot access admin, and submits a lead", async ({
  page,
}) => {
  await login(page, "partner@example.test");
  await expect(page).toHaveURL(/influencer\/dashboard/);
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/influencer\/dashboard/);
  await page.goto("/influencer/leads/new");
  for (const [label, value] of [
    ["Business name", "Browser Test Business"],
    ["Contact person", "Sam"],
    ["Phone number", "9876543210"],
    ["WhatsApp number", "9876543210"],
    ["Business category", "Retail"],
    ["City", "Delhi"],
    ["State", "Delhi"],
    ["Estimated project budget", "40000"],
    ["Preferred contact time", "Afternoon"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel("SEO", { exact: true }).check();
  await page.getByLabel(/I confirm that this customer/).check();
  await page.getByRole("button", { name: "Submit lead", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Browser Test Business");
  await expect(
    page.getByText("SNX-TEST-A1234", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save status and notes" }),
  ).toHaveCount(0);
});
for (const email of ["blocked@example.test", "suspended@example.test"])
  test(`${email} cannot log in`, async ({ page }) => {
    await login(page, email);
    await expect(page.getByRole("status")).toContainText("Unable to sign in");
    await expect(page).toHaveURL(/login/);
  });
test("first login enforces password change and revokes temporary password", async ({
  page,
}) => {
  await login(page, "new@example.test");
  await expect(page).toHaveURL(/change-password/);
  await page.goto("/influencer/leads");
  await expect(page).toHaveURL(/change-password/);
  await page
    .getByLabel("Current password", { exact: true })
    .fill("BrowserTest!1234");
  await page
    .getByLabel("New password", { exact: true })
    .fill("NewBrowserPassword!123");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/login/);
});
test("admin creates an influencer account", async ({ page }) => {
  await login(page, "admin@example.test");
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.goto("/admin/influencers/new");
  for (const [label, value] of [
    ["Full name", "Created Partner"],
    ["Email", "created@example.test"],
    ["Phone number", "9876543210"],
    ["Instagram handle", "@created"],
    ["City", "Delhi"],
    ["State", "Delhi"],
    ["Temporary password", "TemporaryBrowser!123"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Create influencer account" }).click();
  await expect(page.locator("h1")).toHaveText("Created Partner");
  await expect(page.getByText(/Referral code: SNX-CREATEDPAR-/)).toBeVisible();
});
