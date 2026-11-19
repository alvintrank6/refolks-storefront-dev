import { MongoClient } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ensureIndexes } from "../../../scripts/mongo-setup.mjs";
import { MongoRepository } from "./mongo";
import type { OrderDraft } from "./types";

// A replica set, because orders use multi-document transactions (as Atlas does).
let replSet: MongoMemoryReplSet;
let client: MongoClient;
let repo: MongoRepository;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  client = await new MongoClient(replSet.getUri()).connect();
  const db = client.db("refolks-test");
  await ensureIndexes(db);
  repo = new MongoRepository(client, db);
}, 300_000);

afterAll(async () => {
  await client?.close();
  await replSet?.stop();
});

const line = (sku: string, qty: number, stock = 3) => ({
  sku,
  name: sku,
  colour: "-",
  qty,
  unitPrice: 100,
  stock,
});
const draft = (
  lines: OrderDraft["lines"],
  userId: string | null = null,
): OrderDraft => ({
  lines,
  locale: "en",
  name: "A",
  phone: "0900000000",
  email: null,
  address: "x",
  city: "hanoi",
  delivery: "ship",
  payment: "cod",
  userId,
});
const stock = async (sku: string) =>
  (
    await client
      .db("refolks-test")
      .collection("inventory")
      .findOne({ _id: sku as never })
  )?.stock;

describe("mongo accounts", () => {
  it("rejects duplicate emails via the unique index", async () => {
    const input = {
      email: "a@x.test",
      name: "A",
      role: "customer" as const,
      passwordHash: "h",
    };
    expect((await repo.createUser(input))?.email).toBe("a@x.test");
    expect(await repo.createUser(input)).toBeNull();
  });

  it("resolves live sessions only and drops them on role change", async () => {
    const user = (await repo.createUser({
      email: "s@x.test",
      name: "S",
      role: "customer",
      passwordHash: "h",
    }))!;
    await repo.createSession(
      "live",
      user.id,
      new Date(Date.now() + 60_000).toISOString(),
    );
    await repo.createSession(
      "old",
      user.id,
      new Date(Date.now() - 60_000).toISOString(),
    );
    expect((await repo.sessionUser("live"))?.id).toBe(user.id);
    expect(await repo.sessionUser("old")).toBeNull();
    await repo.setLoginState(user.id, 3, null);
    expect((await repo.findUser("s@x.test"))?.failedLogins).toBe(3);
    expect(await repo.setRole(user.id, "admin")).toBe(true);
    expect(await repo.sessionUser("live")).toBeNull();
    expect((await repo.listUsers()).find((u) => u.id === user.id)?.role).toBe(
      "admin",
    );
  });
});

describe("mongo updateUser", () => {
  it("stores verification fields and signs out on password change", async () => {
    const user = (await repo.createUser({
      email: "u@x.test",
      name: "U",
      role: "customer",
      passwordHash: "x",
      emailVerified: false,
    }))!;
    expect((await repo.findUser("u@x.test"))?.emailVerified).toBe(false);
    await repo.createSession(
      "mu",
      user.id,
      new Date(Date.now() + 60_000).toISOString(),
    );
    await repo.updateUser(user.id, {
      emailVerified: true,
      googleId: "g",
      passwordHash: "y",
    });
    const found = await repo.findUser("u@x.test");
    expect([
      found?.emailVerified,
      found?.googleId,
      found?.passwordHash,
    ]).toEqual([true, "g", "y"]);
    expect(await repo.sessionUser("mu")).toBeNull();
  });
});

describe("mongo orders", () => {
  it("reserves stock and lists orders per customer", async () => {
    const placed = await repo.placeOrder(draft([line("bag-a", 2)], "u1"));
    expect(placed.total).toBe(200 + 30_000);
    expect(await stock("bag-a")).toBe(1);
    await repo.placeOrder(draft([line("bag-a", 1)], "u2"));
    expect((await repo.listOrders("u1")).map((o) => o.number)).toEqual([
      placed.number,
    ]);
  });

  it("rolls the whole order back when one line is out of stock", async () => {
    await repo.placeOrder(draft([line("bag-b", 1, 4)])); // seeds bag-b at 4, leaves 3
    await expect(
      repo.placeOrder(draft([line("bag-b", 1), line("bag-c", 5)], "u3")),
    ).rejects.toThrow("OUT_OF_STOCK");
    expect(await stock("bag-b")).toBe(3); // first line's reservation was undone
    expect(await stock("bag-c")).toBeUndefined(); // so was the upsert
    expect(await repo.listOrders("u3")).toEqual([]);
  });

  it("never oversells under concurrent orders", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        repo.placeOrder(draft([line("bag-d", 1)])),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(await stock("bag-d")).toBe(0);
  });

  it("restocks once on cancel and treats cancelled as final", async () => {
    const { number } = await repo.placeOrder(draft([line("bag-e", 2)]));
    expect(await stock("bag-e")).toBe(1);
    expect(await repo.setOrderStatus(number, "confirmed")).toBe("ok");
    expect(await repo.setOrderStatus(number, "cancelled")).toBe("ok");
    expect(await stock("bag-e")).toBe(3);
    expect(await repo.setOrderStatus(number, "cancelled")).toBe("final");
    expect(await stock("bag-e")).toBe(3);
    expect(await repo.setOrderStatus("RV-none", "confirmed")).toBe("not_found");
  });
});

describe("mongo intake", () => {
  it("stores messages and rate-limits per IP", async () => {
    const msg = {
      name: "A",
      contact: "a@x.test",
      topic: "care",
      orderNumber: null,
      body: "hello",
      locale: "en" as const,
      ipHash: "ip-m",
    };
    for (let i = 0; i < 5; i++) await repo.createMessage(msg);
    await expect(repo.createMessage(msg)).rejects.toThrow("RATE_LIMITED");
  });

  it("returns booked visit slots, skipping other dates", async () => {
    const visit = {
      name: "A",
      phone: "0900000000",
      email: null,
      date: "2026-12-01",
      time: "10:00",
      bag: null,
      note: null,
      locale: "vi" as const,
    };
    await repo.createVisit(visit);
    await repo.createVisit({ ...visit, date: "2026-12-02", time: "11:00" });
    expect(await repo.getBookedVisitSlots("2026-12-01")).toEqual(["10:00"]);
  });

  it("saves donation signups with a 3/hour IP limit", async () => {
    const signup = (id: string) => ({
      id,
      name: "A",
      phone: "0900000000",
      email: null,
      role: "volunteer" as const,
      amount: null,
      note: null,
      consentPrivacy: true as const,
      consentRecycle: false,
      locale: "vi" as const,
      eventId: null,
      status: "new" as const,
      createdAt: new Date().toISOString(),
      ipHash: "ip-d",
    });
    for (const id of ["d1", "d2", "d3"])
      expect(await repo.register(signup(id))).toBe("saved");
    expect(await repo.register(signup("d4"))).toBe("rate_limited");
  });
});
