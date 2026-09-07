import { test, expect } from "@playwright/test";

test("contact form validates and reports unavailable email honestly", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByLabel("Your name", { exact: true }).fill("Contact Test");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("contact@example.test");
  await page
    .getByLabel("Tell us about your project")
    .fill("We need a new business website and SEO.");
  await page
    .getByLabel("I agree to be contacted by ScaleNex Digital about my enquiry.")
    .check();
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText(
    "temporarily unavailable",
  );
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Contact Test",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("public influencer registers, waits for approval, and admin activates access", async ({
  page,
}) => {
  await page.goto("/register");
  for (const [name, value] of [
    ["Full name", "Self Registered Partner"],
    ["Email address", "self.browser@example.test"],
    ["Phone number", "9876543210"],
    ["Instagram handle", "@selfregistered"],
    ["City", "Delhi"],
    ["State", "Delhi"],
    ["Password", "BrowserTest!1234"],
    ["Confirm password", "BrowserTest!1234"],
  ])
    await page.getByLabel(name, { exact: true }).fill(value);
  await page
    .getByLabel(
      "I agree to the terms of the influencer program and the privacy policy.",
    )
    .check();
  await page.getByRole("button", { name: "Register as an influencer" }).click();
  await expect(page.getByRole("status")).toContainText(
    "registration has been received",
  );
  await page.getByRole("link", { name: "Go to sign in" }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("self.browser@example.test");
  await page.getByLabel("Password", { exact: true }).fill("BrowserTest!1234");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page.getByRole("status")).toContainText("Unable to sign in");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("admin@example.test");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.goto("/admin/influencers");
  await page
    .getByRole("link", { name: "Self Registered Partner", exact: true })
    .click();
  await page.getByLabel("Account status").selectOption("ACTIVE");
  await page
    .getByLabel("Reason for changes")
    .fill("Registration reviewed and approved");
  await page.getByRole("button", { name: "Save account changes" }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login/);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("self.browser@example.test");
  await page.getByLabel("Password", { exact: true }).fill("BrowserTest!1234");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL(/influencer\/dashboard/);
});
