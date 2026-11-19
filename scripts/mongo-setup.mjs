// Creates the MongoDB indexes the app relies on (unique email, unique order
// number, session TTL, rate-limit lookups). Safe to re-run. Run once per database before first use:
//   node --env-file=.env.local scripts/mongo-setup.mjs
import { MongoClient } from "mongodb";
import { pathToFileURL } from "node:url";

/** @param {import("mongodb").Db} db */
export async function ensureIndexes(db) {
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  // TTL: MongoDB deletes a session once its expiresAt date has passed.
  await db
    .collection("sessions")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("sessions").createIndex({ userId: 1 });
  await db.collection("orders").createIndex({ number: 1 }, { unique: true });
  await db.collection("orders").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("orders").createIndex({ createdAt: -1 });
  // Per-IP hourly rate limits and the visit slot lookup.
  for (const name of ["messages", "visits", "donationSignups"])
    await db.collection(name).createIndex({ ipHash: 1, createdAt: -1 });
  await db.collection("visits").createIndex({ date: 1 });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set (put it in .env.local).");
    process.exit(1);
  }
  const client = await new MongoClient(uri).connect();
  try {
    const name = process.env.MONGODB_DB || "refolks";
    await ensureIndexes(client.db(name));
    console.log(`Indexes ready in database "${name}".`);
  } finally {
    await client.close();
  }
}
