import { D1AccountRepository, type AccountRepository } from "./account";
import { D1StoreRepository } from "./d1";
import { SupabaseStoreRepository } from "./supabase";
import type { DonationSignup } from "./donation";
import type {
  MessageDraft,
  OrderDraft,
  StoreRepository,
  VisitDraft,
} from "./types";

/** The Worker's D1 binding; undefined under plain Node (next dev/build). */
async function workerDb(): Promise<D1Database | undefined> {
  try {
    const mod = "cloudflare:workers";
    const { env } = (await import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ mod
    )) as { env: Cloudflare.Env };
    return env.DB;
  } catch {
    return undefined;
  }
}

/** MongoDB (accounts, sessions, orders, stock) when MONGODB_URI is set. */
async function mongoRepository() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  const { MongoRepository } = await import("./mongo");
  const worker =
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers";
  return MongoRepository.open(uri, process.env.MONGODB_DB || "refolks", worker);
}

/** Orders, visits, messages and donations: MongoDB when MONGODB_URI is set, else D1/Supabase/local. */
export async function storeRepository(
  db?: D1Database,
): Promise<StoreRepository> {
  if (!process.env.MONGODB_URI) return baseStoreRepository(db);

  // In Mongo mode the catalogue and donation event stay static, while every
  // write goes to MongoDB. Avoid initializing a legacy production adapter
  // first: Vercel has no D1 binding, and DATA_SOURCE is intentionally unset.
  const { LocalStoreRepository } = await import("./local");
  const base = new LocalStoreRepository();
  const mongo = async () => (await mongoRepository())!;
  return Object.assign(Object.create(base) as StoreRepository, {
    placeOrder: async (draft: OrderDraft) => (await mongo()).placeOrder(draft),
    createVisit: async (draft: VisitDraft) =>
      (await mongo()).createVisit(draft),
    getBookedVisitSlots: async (date: string) =>
      (await mongo()).getBookedVisitSlots(date),
    createMessage: async (draft: MessageDraft) =>
      (await mongo()).createMessage(draft),
    register: async (signup: DonationSignup) =>
      (await mongo()).register(signup),
  });
}

/** D1 serves the Worker build. Plain Node development defaults to local JSONL. */
async function baseStoreRepository(db?: D1Database): Promise<StoreRepository> {
  if (process.env.DATA_SOURCE === "supabase") {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key)
      throw new Error("Supabase server credentials are missing");
    return new SupabaseStoreRepository(url, key);
  }
  db ??= await workerDb();
  if (db) return new D1StoreRepository(db);
  // DATA_SOURCE=local lets E2E run against `next start`; never set it on a real deployment.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DATA_SOURCE !== "local"
  )
    throw new Error("No production data store configured");
  const { LocalStoreRepository } = await import("./local");
  return new LocalStoreRepository();
}

export const donationRepository = storeRepository;

/** Users, roles, sessions and order administration: MongoDB, else D1 on the Worker, else `.data/`. */
export async function accountRepository(): Promise<AccountRepository> {
  const mongo = await mongoRepository();
  if (mongo) return mongo;
  // shortcut: no Supabase adapter for accounts; add one if DATA_SOURCE=supabase is ever adopted.
  if (process.env.DATA_SOURCE === "supabase")
    throw new Error("Accounts are not implemented for Supabase");
  const db = await workerDb();
  if (db) return new D1AccountRepository(db);
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DATA_SOURCE !== "local"
  )
    throw new Error("No production data store configured");
  const { LocalAccountRepository } = await import("./account-local");
  return new LocalAccountRepository();
}
