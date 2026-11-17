import { readFile } from "node:fs/promises";
import pg from "pg";

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connectionString) throw new Error("Supabase Postgres connection is missing");

const dbUrl = new URL(connectionString);
dbUrl.searchParams.set("sslmode", "require");
dbUrl.searchParams.set("uselibpqcompat", "true");
const client = new pg.Client({ connectionString: dbUrl.toString(), connectionTimeoutMillis: 15000 });
await client.connect();
try {
  const files = [
    "supabase/migrations/20261030_store_v2.sql",
    "supabase/migrations/20261030_donation_v2.sql",
    "supabase/migrations/20261031_form_rate_v2.sql",
    "supabase/seed.sql",
  ];
  for (const file of files) {
    const sql = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    await client.query(sql);
    process.stdout.write(`Applied ${file}\n`);
  }
} finally {
  await client.end();
}
