import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { LocalAccountRepository } from "./account-local";
import { LocalStoreRepository } from "./local";

let directory: string;
let accounts: LocalAccountRepository;
let store: LocalStoreRepository;

beforeAll(async () => {
  const parent = join(process.cwd(), "test-results");
  await mkdir(parent, { recursive: true });
  directory = await mkdtemp(join(parent, "accounts-"));
  accounts = new LocalAccountRepository(directory);
  store = new LocalStoreRepository(directory);
});

describe("local account adapter", () => {
  it("refuses a duplicate email and resolves live sessions only", async () => {
    const input = {
      email: "a@example.com",
      name: "A",
      role: "customer" as const,
      passwordHash: "x",
    };
    const user = await accounts.createUser(input);
    expect(user?.role).toBe("customer");
    expect(await accounts.createUser(input)).toBeNull();

    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    await accounts.createSession("live", user!.id, future);
    await accounts.createSession("old", user!.id, past);
    expect((await accounts.sessionUser("live"))?.email).toBe("a@example.com");
    expect(await accounts.sessionUser("old")).toBeNull();

    // A role change signs the user out everywhere.
    await accounts.setRole(user!.id, "admin");
    expect(await accounts.sessionUser("live")).toBeNull();
  });

  it("lists a customer's orders and restocks once on cancel", async () => {
    const line = {
      sku: "test-sku",
      name: "Bag",
      colour: "-",
      qty: 2,
      unitPrice: 100,
      stock: 5,
    };
    const draft = {
      lines: [line],
      locale: "en" as const,
      name: "A",
      phone: "0900000000",
      email: null,
      address: "x",
      city: "hanoi" as const,
      delivery: "ship" as const,
      payment: "cod" as const,
    };
    const mine = await store.placeOrder({ ...draft, userId: "u1" });
    await store.placeOrder({ ...draft, userId: "u2" });
    const listed = await accounts.listOrders("u1");
    expect(listed.map((o) => o.number)).toEqual([mine.number]);
    expect(listed[0].status).toBe("pending_confirmation");

    const stock = async () =>
      JSON.parse(await readFile(join(directory, "store.json"), "utf8"))
        .inventory["test-sku"];
    expect(await stock()).toBe(1);
    expect(await accounts.setOrderStatus(mine.number, "cancelled")).toBe("ok");
    expect(await stock()).toBe(3);
    expect(await accounts.setOrderStatus(mine.number, "cancelled")).toBe(
      "final",
    );
    expect(await stock()).toBe(3);
    expect(await accounts.setOrderStatus("nope", "confirmed")).toBe(
      "not_found",
    );
  });
});
