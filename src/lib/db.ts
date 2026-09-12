import mongoose, { type ClientSession } from "mongoose";
let connection: Promise<typeof mongoose> | undefined;
let transactionSupport: Promise<boolean> | undefined;
export async function db() {
  if (!process.env.MONGODB_URI) throw new Error("Database is not configured");
  connection ??= mongoose
    .connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "scalenex",
      retryWrites: false,
      serverSelectionTimeoutMS: 5000,
    })
    .catch((e) => {
      connection = undefined;
      throw e;
    });
  return connection;
}

async function supportsTransactions() {
  transactionSupport ??= (async () => {
    await db();
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    return Boolean(hello.setName || hello.msg === "isdbgrid");
  })();
  return transactionSupport;
}

export type DatabaseSession = ClientSession | null;

export async function dbTransaction<T>(
  operation: (session: DatabaseSession) => Promise<T>,
) {
  await db();
  if (await supportsTransactions())
    return mongoose.connection.transaction(operation);
  return operation(null);
}
