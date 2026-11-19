// Grants a role to an existing account. Uses MongoDB when MONGODB_URI is set,
// otherwise the local `.data/` store.
// Usage: node --env-file-if-exists=.env.local scripts/set-role.mjs <email> <customer|support|admin|super_admin>
// D1: npx wrangler d1 execute DB --local --command "UPDATE users SET role='super_admin' WHERE email='you@example.com'"
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const [rawEmail, role] = process.argv.slice(2);
const roles = ["customer", "support", "admin", "super_admin"];
if (!rawEmail || !roles.includes(role)) {
  console.error("Usage: node scripts/set-role.mjs <email> <" + roles.join("|") + ">");
  process.exit(1);
}
const email = rawEmail.toLowerCase();
const fail = () => {
  console.error(`No account for ${email}; sign up first.`);
  process.exit(1);
};

if (process.env.MONGODB_URI) {
  const { MongoClient } = await import("mongodb");
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  try {
    const db = client.db(process.env.MONGODB_DB || "refolks");
    const user = await db.collection("users").findOneAndUpdate({ email }, { $set: { role } });
    if (!user) fail();
    // A role change signs the user out everywhere, matching the app.
    await db.collection("sessions").deleteMany({ userId: user._id });
  } finally {
    await client.close();
  }
} else {
  const file = join(process.env.DATA_DIR ?? ".data", "accounts.json");
  const data = JSON.parse(await readFile(file, "utf8"));
  const user = data.users.find((u) => u.email === email);
  if (!user) fail();
  user.role = role;
  data.sessions = data.sessions.filter((s) => s.userId !== user.id);
  await writeFile(file, JSON.stringify(data), "utf8");
}
console.log(`${email} is now ${role} (signed out; log in again).`);
