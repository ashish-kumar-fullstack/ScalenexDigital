import mongoose from "mongoose";
let connection: Promise<typeof mongoose> | undefined;
export async function db() {
  if (!process.env.MONGODB_URI) throw new Error("Database is not configured");
  connection ??= mongoose
    .connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "scalenex",
      serverSelectionTimeoutMS: 5000,
    })
    .catch((e) => {
      connection = undefined;
      throw e;
    });
  return connection;
}
