import { execFileSync } from "node:child_process";
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from "@playwright/test";

// Needs `next start` with DATA_SOURCE=local and the default `.data/` directory (set-role edits it).
// Start from an empty `.data/`: orders reserve real stock (The Herald has 8, The Navigator 12).
const run = Date.now();
const email = (name: string) => `${name}-${run}@example.com`;
const password = "correct-horse-1";
const baseURL = "http://127.0.0.1:4175";
const json = (data: unknown) => ({
  data,
  headers: { "content-type": "application/json" },
});
const setRole = (address: string, role: string) =>
  execFileSync("node", ["scripts/set-role.mjs", address, role]);

async function client(name: string, signUp = true) {
  const ctx = await playwrightRequest.newContext({ baseURL });
  if (signUp)
    expect(
      (
        await ctx.post(
          "/api/auth/signup",
          json({ name, email: email(name), password }),
        )
      ).status(),
    ).toBe(200);
  return ctx;
}
const login = (ctx: APIRequestContext, name: string, pass = password) =>
  ctx.post("/api/auth/login", json({ email: email(name), password: pass }));
const checkout = (ctx: APIRequestContext) =>
  ctx.post(
    "/api/checkout",
    json({
      locale: "vi",
      name: "Khách Thử",
      email: "buyer@example.com",
      phone: "0900000000",
      address: "12 Hàng Bài, Hà Nội",
      region: "hanoi",
      items: [{ id: "the-navigator", qty: 1, color: "brown", personal: false }],
    }),
  );

test.describe("auth API", () => {
  test("sign up, me, log out, log in", async () => {
    const ctx = await client("alice");
    expect((await (await ctx.get("/api/auth/me")).json()).user).toMatchObject({
      email: email("alice"),
      role: "customer",
    });
    expect(
      (
        await ctx.post(
          "/api/auth/signup",
          json({ name: "Alice", email: email("alice"), password }),
        )
      ).status(),
    ).toBe(409);
    expect((await ctx.post("/api/auth/logout")).status()).toBe(200);
    expect((await (await ctx.get("/api/auth/me")).json()).user).toBeNull();
    expect((await login(ctx, "alice", "wrong-password")).status()).toBe(401);
    expect((await login(ctx, "nobody")).status()).toBe(401);
    expect((await login(ctx, "alice")).status()).toBe(200);
    expect((await (await ctx.get("/api/auth/me")).json()).user.name).toBe(
      "alice",
    );
  });

  test("validates input and refuses non-JSON bodies", async () => {
    const ctx = await client("val", false);
    expect(
      (
        await ctx.post(
          "/api/auth/signup",
          json({ name: "V", email: email("v1"), password }),
        )
      ).status(),
    ).toBe(400);
    expect(
      (
        await ctx.post(
          "/api/auth/signup",
          json({ name: "Val", email: "bad", password }),
        )
      ).status(),
    ).toBe(400);
    expect(
      (
        await ctx.post(
          "/api/auth/signup",
          json({ name: "Val", email: email("v2"), password: "short" }),
        )
      ).status(),
    ).toBe(400);
    const form = await ctx.post("/api/auth/login", {
      data: JSON.stringify({ email: email("val"), password }),
      headers: { "content-type": "text/plain" },
    });
    expect(form.status()).toBe(400);
  });

  test("locks the account after 5 wrong passwords", async () => {
    const ctx = await client("locky");
    for (let i = 0; i < 5; i++)
      expect((await login(ctx, "locky", "nope-nope")).status()).toBe(401);
    expect((await login(ctx, "locky")).status()).toBe(429);
  });
});

test.describe("roles and orders", () => {
  test("guest and customer are kept out of admin", async () => {
    const guest = await client("guest", false);
    expect((await guest.get("/api/admin/orders")).status()).toBe(401);
    expect((await guest.get("/api/account/orders")).status()).toBe(401);
    const customer = await client("cust");
    expect((await customer.get("/api/admin/orders")).status()).toBe(403);
    expect((await customer.get("/api/admin/users")).status()).toBe(403);
  });

  test("orders belong to the signed-in customer", async () => {
    const buyer = await client("buyer");
    const placed = await checkout(buyer);
    expect(placed.status()).toBe(200);
    const { number } = await placed.json();
    const mine = (await (await buyer.get("/api/account/orders")).json()).orders;
    expect(mine.map((o: { number: string }) => o.number)).toEqual([number]);
    const other = await client("other");
    expect(
      (await (await other.get("/api/account/orders")).json()).orders,
    ).toEqual([]);
  });

  test("support reads, admin writes, super admin manages roles", async () => {
    const buyer = await client("buyer2");
    const { number } = await (await checkout(buyer)).json();

    await client("staff");
    setRole(email("staff"), "support");
    const staff = await client("staff", false);
    expect((await login(staff, "staff")).status()).toBe(200);
    expect((await staff.get("/api/admin/orders")).status()).toBe(200);
    expect(
      (
        await staff.patch(
          "/api/admin/orders",
          json({ number, status: "confirmed" }),
        )
      ).status(),
    ).toBe(403);

    setRole(email("staff"), "admin");
    expect((await staff.get("/api/admin/orders")).status()).toBe(401); // role change ends sessions
    expect((await login(staff, "staff")).status()).toBe(200);
    expect(
      (
        await staff.patch(
          "/api/admin/orders",
          json({ number, status: "bogus" }),
        )
      ).status(),
    ).toBe(400);
    expect(
      (
        await staff.patch(
          "/api/admin/orders",
          json({ number, status: "confirmed" }),
        )
      ).status(),
    ).toBe(200);
    expect(
      (
        await staff.patch(
          "/api/admin/orders",
          json({ number, status: "cancelled" }),
        )
      ).status(),
    ).toBe(200);
    expect(
      (
        await staff.patch(
          "/api/admin/orders",
          json({ number, status: "shipping" }),
        )
      ).status(),
    ).toBe(409);
    const mine = (await (await buyer.get("/api/account/orders")).json()).orders;
    expect(mine[0].status).toBe("cancelled");
    expect((await staff.get("/api/admin/users")).status()).toBe(403);

    await client("boss");
    setRole(email("boss"), "super_admin");
    const boss = await client("boss", false);
    expect((await login(boss, "boss")).status()).toBe(200);
    const users = (await (await boss.get("/api/admin/users")).json()).users as {
      id: string;
      email: string;
    }[];
    const bossId = users.find((u) => u.email === email("boss"))!.id;
    const staffId = users.find((u) => u.email === email("staff"))!.id;
    expect(
      (
        await boss.patch(
          "/api/admin/users",
          json({ id: bossId, role: "customer" }),
        )
      ).status(),
    ).toBe(409);
    expect(
      (
        await boss.patch(
          "/api/admin/users",
          json({ id: staffId, role: "root" }),
        )
      ).status(),
    ).toBe(400);
    expect(
      (
        await boss.patch(
          "/api/admin/users",
          json({ id: staffId, role: "customer" }),
        )
      ).status(),
    ).toBe(200);
  });
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`UI (${reducedMotion})`, () => {
    test.use({ reducedMotion });
    test("sign up, order history and sign out", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("refolks-member-dismissed", String(Date.now()));
        localStorage.setItem("refolks-event-dismissed", String(Date.now()));
      });
      const address = email(`ui-${reducedMotion}`);
      await page.goto("/vi/account");
      await expect(page.locator(".rf-site")).toHaveAttribute(
        "data-ready",
        "true",
      );
      await page.locator(".rf-account-page .rf-button").click();
      const account = page.getByRole("dialog", { name: "Tài khoản" });
      await account
        .getByRole("button", { name: "Tạo tài khoản" })
        .first()
        .click();
      await account.getByLabel("Họ và tên").fill("Mai Anh");
      await account.getByLabel("Email").fill(address);
      await account.getByLabel("Mật khẩu").fill(password);
      await account
        .getByRole("button", { name: "Tạo tài khoản" })
        .last()
        .click();
      await expect(page.getByRole("status")).toContainText(
        "Xin chào, Mai Anh!",
      );

      // Quick add from the shop grid used to send the wrong colour; it must check out now.
      await page.goto("/vi/shop");
      await page
        .locator(".rf-shop-grid .rf-the-herald")
        .getByRole("button", { name: "Thêm vào giỏ" })
        .click();
      await page
        .getByRole("dialog", { name: "Giỏ hàng" })
        .getByRole("button", { name: "Thanh toán ngay" })
        .click();
      const form = page.locator(".rf-cart-summary form");
      await form.getByLabel("Họ và tên").fill("Mai Anh");
      await form.getByLabel("Email").fill(address);
      await form.getByLabel("Số điện thoại").fill("0900000000");
      await form.getByLabel("Địa chỉ").fill("12 Hàng Bài, Hà Nội");
      const placed = page.waitForResponse("**/api/checkout");
      await form.locator("button[type=submit]").click();
      expect((await placed).status()).toBe(200);

      await page.goto("/vi/account");
      await expect(page.locator(".rf-account-page .rf-order")).toHaveCount(1);
      await expect(page.locator(".rf-account-page .rf-order")).toContainText(
        "Chờ xác nhận",
      );

      await page.reload(); // session survives a reload (cookie, not localStorage)
      await expect(page.locator(".rf-account-page .rf-order")).toHaveCount(1);
      await page.getByRole("button", { name: "Tài khoản" }).first().click();
      await page
        .getByRole("dialog", { name: "Tài khoản" })
        .getByRole("button", { name: "Đăng xuất" })
        .click();
      await expect(page.locator(".rf-account-page .rf-order")).toHaveCount(0);
      expect(
        (await (await page.request.get("/api/auth/me")).json()).user,
      ).toBeNull();
    });
  });
}

test("admin page: support sees orders read-only, admin can change status", async ({
  page,
}) => {
  // Newest order is this one, so the first row is never an already-cancelled order.
  expect((await checkout(await client("pageadmin"))).status()).toBe(200);
  setRole(email("pageadmin"), "support");
  expect((await login(page.request, "pageadmin")).status()).toBe(200);
  await page.goto("/vi/admin");
  await expect(page.getByRole("heading", { name: "Quản trị" })).toBeVisible();
  await expect(page.locator(".rf-admin .rf-order").first()).toBeVisible();
  await expect(page.locator(".rf-admin select")).toHaveCount(0);

  setRole(email("pageadmin"), "admin");
  expect((await login(page.request, "pageadmin")).status()).toBe(200);
  await page.reload();
  const first = page.locator(".rf-admin [data-order]").first();
  const status = first.getByLabel("Trạng thái");
  await expect(status).toBeVisible();
  await status.selectOption("confirmed");
  await expect(
    page.getByRole("status").filter({ hasText: "Đã cập nhật." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tài khoản & phân quyền" }),
  ).toHaveCount(0);

  const customer = await client("pagecust");
  void customer;
  await page.context().clearCookies();
  expect((await login(page.request, "pagecust")).status()).toBe(200);
  await page.goto("/vi/admin");
  await expect(page.locator(".rf-admin")).toHaveCount(0);
});
