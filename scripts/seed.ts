import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { bootstrapDatabase } from "../src/lib/bootstrap";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
bootstrapDatabase()
  .then((result) => {
    console.log(
      result?.created
        ? "Admin created. Change the initial password on first login."
        : "Admin already exists; credentials and status unchanged.",
    );
    console.log("Database collections and commission rules initialized.");
  })
  .catch((error) => {
    // Never log connection strings, passwords, or raw database errors.
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Database initialization failed (${name}). Check MONGODB_URI, Atlas network access and permissions, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD (at least 12 characters).`,
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
