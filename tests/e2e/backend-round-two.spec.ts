import { expect, test } from "@playwright/test";

// Needs the build served with DATA_SOURCE=local (or a D1 binding). Each run reserves 1 Herald from local stock.
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`round-two backend (${reducedMotion})`, () => {
    // A fresh client IP per run keeps the 5-per-hour message rate limit from tripping on reruns.
    test.use({
      reducedMotion,
      extraHTTPHeaders: {
        "x-forwarded-for": `e2e-${reducedMotion}-${Date.now()}`,
      },
    });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("refolks-member-dismissed", String(Date.now()));
        localStorage.setItem("refolks-event-dismissed", String(Date.now()));
      });
    });

    test("checkout places a real order", async ({ page }) => {
      await page.goto("/vi/products/the-herald");
      await page.locator(".rf-pdp-buy .rf-button").click();
      const bag = page.getByRole("dialog", { name: "Giỏ hàng" });
      await bag.getByRole("button", { name: "Thanh toán ngay" }).click();
      await expect(page).toHaveURL(/\/vi\/checkout/);
      const order = page.waitForResponse("**/api/checkout");
      const form = page.locator(".rf-cart-summary form");
      await form.getByLabel("Họ và tên").fill("Khách Thử");
      await form.getByLabel("Email").fill("test@example.com");
      await form.getByLabel("Số điện thoại").fill("0900000000");
      await form.getByLabel("Địa chỉ").fill("12 Hàng Bài, Hà Nội");
      await form.locator("button[type=submit]").click();
      const response = await order;
      expect(response.status()).toBe(200);
      expect(await response.json()).toMatchObject({
        number: expect.stringMatching(/^RV\d+$/),
        total: 1_620_000,
      });
      await expect(page.getByRole("status")).toContainText(
        "Đơn hàng đã được ghi nhận",
      );
    });

    test("care booking and newsletter reach the API", async ({ page }) => {
      await page.goto("/vi/huong-dan-bao-quan");
      await page.getByRole("button", { name: "Đặt lịch bảo dưỡng" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Họ và tên").fill("Khách Thử");
      await dialog.getByLabel("Email").fill("test@example.com");
      await dialog.getByLabel("Số điện thoại").fill("0900000000");
      await dialog.getByLabel("Ghi chú").fill("Quai bị sờn, cần sửa.");
      const care = page.waitForResponse("**/api/requests");
      await dialog.getByRole("button", { name: "Gửi" }).click();
      expect((await care).status()).toBe(200);
      await expect(page.getByRole("status")).toContainText(
        "Đã ghi nhận yêu cầu bảo dưỡng",
      );

      const footer = page.locator("footer form");
      await footer.getByRole("textbox").fill("test@example.com");
      const newsletter = page.waitForResponse("**/api/requests");
      await footer.getByRole("button").click();
      expect((await newsletter).status()).toBe(200);
    });

    test("API rejects tampered and invalid input", async ({ request }) => {
      const base = {
        locale: "en",
        name: "Test",
        email: "test@example.com",
        phone: "0900000000",
        address: "12 Hang Bai",
        region: "hanoi",
      };
      const bad = await request.post("/api/checkout", {
        data: {
          ...base,
          items: [
            { id: "the-herald", qty: 99, color: "cream", personal: false },
          ],
        },
      });
      expect(bad.status()).toBe(400);
      const unknown = await request.post("/api/requests", {
        data: { kind: "other", email: "test@example.com" },
      });
      expect(unknown.status()).toBe(400);
    });
  });
}
