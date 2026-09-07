import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  expect: { timeout: 20000 },
  globalSetup: "./tests/e2e/setup.ts",
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.E2E_PRODUCTION === "1"
      ? "node node_modules/next/dist/bin/next start --port 3100"
      : "node node_modules/next/dist/bin/next dev --webpack --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      E2E_TEST: process.env.E2E_PRODUCTION === "1" ? "0" : "1",
      MONGODB_URI: "mongodb://127.0.0.1:27027/?replicaSet=testset",
      MONGODB_DB_NAME: "scalenex_e2e",
      AUTH_SECRET: randomBytes(32).toString("hex"),
      NEXTAUTH_URL: "http://localhost:3100",
      NEXT_PUBLIC_APP_URL: "http://localhost:3100",
      SMTP_HOST: "",
      SMTP_PASSWORD: "",
    },
  },
});
