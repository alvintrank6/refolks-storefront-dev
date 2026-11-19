// Loads clearly-marked test data into MongoDB (one account per role, orders in
// every status, messages, visits, donation signups). Safe to re-run: documents
// have fixed `sample-*` ids and `sample: true`; `--reset` removes only those.
//   node --env-file=.env.local scripts/mongo-seed.mjs [--reset]
// Login password for every sample account: SEED_PASSWORD (required, never committed;
// the repo is public and these accounts include a super_admin).
import { MongoClient } from "mongodb";
import { ensureIndexes } from "./mongo-setup.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set (put it in .env.local).");
  process.exit(1);
}
const password = process.env.SEED_PASSWORD ?? "";
if (!process.argv.includes("--reset") && password.length < 12) {
  console.error("Set SEED_PASSWORD (12+ characters) in .env.local first.");
  process.exit(1);
}

// Same format as src/lib/auth/crypto.ts: pbkdf2$<iterations>$<salt>$<hash>.
const hex = (b) => Buffer.from(b).toString("hex");
async function hashPassword(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pw),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 },
    key,
    256,
  );
  return `pbkdf2$100000$${hex(salt)}$${hex(new Uint8Array(bits))}`;
}

const day = 86_400_000;
const ago = (days) => new Date(Date.now() - days * day).toISOString();
// Real catalogue ids/prices/stock from src/refolks/data.ts.
const catalogue = {
  "the-herald": {
    name: "The Herald",
    colour: "Cream",
    price: 1_790_000,
    stock: 8,
  },
  "the-curator": {
    name: "The Curator",
    colour: "Brown",
    price: 1_890_000,
    stock: 8,
  },
  "the-vanguard": {
    name: "The Vanguard",
    colour: "Brown",
    price: 1_890_000,
    stock: 12,
  },
  "the-navigator": {
    name: "The Navigator",
    colour: "Brown",
    price: 2_190_000,
    stock: 6,
  },
  "elephant-keychain": {
    name: "Elephant Keychain",
    colour: "Brown",
    price: 190_000,
    stock: 6,
  },
};

const hash = await hashPassword(password);
const user = (role, n = "") => ({
  _id: `sample-user-${role}${n}`,
  email: `${role.replace("_", "-")}${n}@example.test`,
  name: `Test ${role}${n}`,
  role,
  passwordHash: hash,
  failedLogins: 0,
  lockedUntil: null,
  createdAt: ago(30),
  sample: true,
});
const users = [
  user("customer", 1),
  user("customer", 2),
  user("support"),
  user("admin"),
  user("super_admin"),
];

const order = (n, status, items, userId, city = "hanoi", daysAgo = n) => {
  const lines = items.map(([sku, qty]) => {
    const p = catalogue[sku];
    return { sku, name: p.name, colour: p.colour, qty, unitPrice: p.price };
  });
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const shippingFee = city === "hanoi" ? 30_000 : 40_000; // policy.ts
  const owner = users.find((u) => u._id === userId);
  return {
    _id: `sample-order-${n}`,
    number: `RVSAMPLE${String(n).padStart(3, "0")}`,
    token: `sample-token-${n}`,
    createdAt: ago(daysAgo),
    locale: n % 2 ? "vi" : "en",
    status,
    paymentMethod: status === "pending_payment" ? "transfer" : "cod",
    delivery: "ship",
    customerName: owner?.name ?? `Test guest ${n}`,
    phone: `09000000${String(n).padStart(2, "0")}`,
    email: owner?.email ?? null,
    address: `Test address ${n}`,
    city,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    userId: userId ?? null,
    items: lines,
    sample: true,
  };
};
const orders = [
  order(
    1,
    "pending_confirmation",
    [["the-herald", 1]],
    "sample-user-customer1",
  ),
  order(
    2,
    "pending_payment",
    [
      ["the-curator", 1],
      ["elephant-keychain", 2],
    ],
    "sample-user-customer1",
    "other",
  ),
  order(3, "confirmed", [["the-vanguard", 1]], "sample-user-customer2"),
  order(4, "shipping", [["the-navigator", 1]], null, "other"),
  order(5, "completed", [["the-vanguard", 2]], "sample-user-customer2"),
  order(6, "cancelled", [["the-herald", 1]], null),
];

const base = (kind, n, daysAgo) => ({
  _id: `sample-${kind}-${n}`,
  createdAt: ago(daysAgo),
  ipHash: null,
  sample: true,
});
const messages = [
  {
    ...base("message", 1, 2),
    name: "Test customer1",
    contact: "customer1@example.test / 0900000001",
    topic: "care",
    orderNumber: "RVSAMPLE005",
    body: "Test care request: strap needs checking.",
    locale: "vi",
    status: "new",
  },
  {
    ...base("message", 2, 1),
    name: "newsletter@example.test",
    contact: "newsletter@example.test",
    topic: "newsletter",
    orderNumber: null,
    body: "Newsletter signup",
    locale: "en",
    status: "new",
  },
];
const visitDate = (d) =>
  new Date(Date.now() + d * day).toISOString().slice(0, 10);
const visits = [
  {
    ...base("visit", 1, 1),
    name: "Test visitor 1",
    phone: "0900000011",
    email: null,
    date: visitDate(3),
    time: "10:00",
    bag: "the-vanguard",
    note: null,
    locale: "vi",
    status: "requested",
  },
  {
    ...base("visit", 2, 1),
    name: "Test visitor 2",
    phone: "0900000012",
    email: "visitor2@example.test",
    date: visitDate(3),
    time: "14:00",
    bag: null,
    note: "Test note",
    locale: "en",
    status: "requested",
  },
  {
    ...base("visit", 3, 2),
    name: "Test visitor 3",
    phone: "0900000013",
    email: null,
    date: visitDate(4),
    time: "10:00",
    bag: null,
    note: null,
    locale: "vi",
    status: "cancelled",
  },
];
const signup = (n, role, amount, consentRecycle) => ({
  ...base("donation", n, n),
  name: `Test donor ${n}`,
  phone: `09000000${20 + n}`,
  email: null,
  role,
  amount,
  note: null,
  consentPrivacy: true,
  consentRecycle,
  locale: "vi",
  eventId: null,
  status: "new",
});
const donationSignups = [
  signup(1, "donate", "one", true),
  signup(2, "volunteer", null, false),
  signup(3, "both", "two-three", true),
];

const sets = { users, orders, messages, visits, donationSignups };
const client = await new MongoClient(uri).connect();
try {
  const db = client.db(process.env.MONGODB_DB || "refolks");
  if (process.argv.includes("--reset")) {
    for (const name of Object.keys(sets)) {
      const { deletedCount } = await db
        .collection(name)
        .deleteMany({ sample: true });
      console.log(`${name}: removed ${deletedCount}`);
    }
    await db
      .collection("sessions")
      .deleteMany({ userId: { $regex: "^sample-" } });
  } else {
    await ensureIndexes(db);
    for (const [name, docs] of Object.entries(sets)) {
      await db
        .collection(name)
        .bulkWrite(
          docs.map((d) => ({
            replaceOne: {
              filter: { _id: d._id },
              replacement: d,
              upsert: true,
            },
          })),
        );
      console.log(`${name}: ${docs.length} sample docs`);
    }
    // Only creates stock rows that are missing; never overwrites real stock.
    await db
      .collection("inventory")
      .bulkWrite(
        Object.entries(catalogue).map(([sku, p]) => ({
          updateOne: {
            filter: { _id: sku },
            update: { $setOnInsert: { stock: p.stock } },
            upsert: true,
          },
        })),
      );
    console.log(
      `Accounts: ${users.map((u) => `${u.email} (${u.role})`).join(", ")}`,
    );
    console.log(
      "Password: the SEED_PASSWORD value in .env.local",
    );
  }
} finally {
  await client.close();
}
