import { expect, test } from "@playwright/test";

test.use({ baseURL: "http://127.0.0.1:3000" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("refolks-member-dismissed", String(Date.now()));
    localStorage.setItem("refolks-event-dismissed", String(Date.now()));
  });
});

test("collection, accessories, product and demo checkout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/vi/shop");
  await expect(page.locator(".rf-shop-grid .rf-product-card")).toHaveCount(5);
  await expect(page.locator(".rf-shop-grid")).toContainText("Móc khóa Voi");
  await expect(page.locator(".rf-shop-grid")).toContainText("2.190.000₫");
  await page.goto("/vi/accessories");
  await expect(page.locator(".rf-shop-grid .rf-product-card")).toHaveCount(5);
  await expect(page.locator(".rf-shop-grid")).toContainText("Cardholder");
  await expect(page.locator(".rf-coming-card")).toHaveCount(3);
  await page.goto("/vi/products/the-vanguard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Vanguard");
  await page.getByLabel("Phiên bản").selectOption("men-cardholder");
  const accordion = page.locator(".rf-accordions details").first();
  await expect(accordion.locator("p")).toBeHidden();
  await accordion.locator("summary").click();
  await expect(accordion.locator("p")).toBeVisible();
  await page.locator(".rf-pdp-buy .rf-button").click();
  await expect(page).toHaveURL(/the-vanguard$/);
  await expect(page.getByRole("dialog", { name: "Giỏ hàng" })).toContainText("1.890.000₫");
  await page.getByRole("dialog", { name: "Giỏ hàng" }).getByRole("button", { name: "Thanh toán ngay" }).click();
  await expect(page).toHaveURL(/\/vi\/checkout/);
  await page.getByLabel("Khu vực giao hàng").selectOption("other");
  await expect(page.locator(".rf-total")).toContainText("1.930.000₫");
  expect(errors).toEqual([]);
});

test("navigation, guides, chatbot and friendly 404", async ({ page }) => {
  await page.goto("/vi");
  await page.getByRole("button", { name: /Khám phá bộ sưu tập/i }).first().click();
  await expect(page).toHaveURL(/\/vi\/collections\/heritage-in-motion/);
  await page.goto("/vi/huong-dan-phoi-do");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hướng dẫn phối đồ");
  await page.goto("/vi/huong-dan-bao-quan");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hướng dẫn bảo quản");
  await page.getByRole("button", { name: "Chat" }).click();
  await page.getByRole("button", { name: "Giá & khuyến mãi" }).click();
  await expect(page.locator(".rf-chat-messages")).toContainText("1.890.000₫");
  const response = await page.goto("/vi/not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Không tìm thấy trang");
});

test("mobile menu and responsive pages", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ["/vi", "/vi/shop", "/vi/products/the-herald", "/vi/community"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
  }
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.getByRole("dialog", { name: "Mở menu" })).toBeVisible();
  await page.getByRole("dialog", { name: "Mở menu" }).getByText("Túi nữ").click();
  await page.getByRole("dialog", { name: "Mở menu" }).getByRole("button", { name: "Tất cả sản phẩm" }).first().click();
  await expect(page).toHaveURL(/\/vi\/shop\?gender=women/);
  for (const width of [768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/vi", "/vi/shop", "/vi/products/the-herald", "/vi/community"]) {
      await page.goto(path);
      await expect(page.locator(".rf-site")).toHaveAttribute("data-ready", "true");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test("member dashboard, donation voucher and workshop registration", async ({ page }) => {
  await page.goto("/vi/community");
  await expect(page.locator(".rf-site")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Đăng nhập / Đăng ký" }).click();
  const account = page.getByRole("dialog", { name: "Tài khoản" });
  await account.getByRole("button", { name: "Tạo tài khoản" }).first().click();
  await account.getByLabel("Họ và tên").fill("Mai Anh");
  await account.getByLabel("Email").fill("mai@example.com");
  await account.getByLabel("Mật khẩu").fill("demo-password");
  await account.getByRole("button", { name: "Tạo tài khoản" }).last().click();
  await expect(page.locator(".rf-benefits-card")).toHaveCount(4);
  await expect(page.locator(".rf-benefits")).toContainText("Mai Anh");
  await expect(page.locator(".rf-benefits")).toContainText("NEW15");
  const donation = page.locator(".rf-donation-form form");
  await donation.getByLabel("Họ và tên").fill("Mai Anh");
  await donation.getByLabel("Số điện thoại").fill("0900000000");
  await donation.getByLabel("Email").fill("mai@example.com");
  await donation.getByLabel("Số lượng/kg ước tính").fill("2");
  await donation.getByLabel("Ngày hẹn").fill("2026-11-15");
  await donation.getByRole("button", { name: "Gửi thông tin" }).click();
  await expect(page.locator(".rf-benefits")).toContainText("DONATE15");
  await page.getByRole("button", { name: /Đăng Ký Chỗ Ngồi/i }).click();
  const event = page.getByRole("dialog").last();
  await event.getByLabel("Họ và tên").fill("Mai Anh");
  await event.getByLabel("Số điện thoại").fill("0900000000");
  await event.getByLabel("Email").fill("mai@example.com");
  await event.getByLabel("Số người").fill("1");
  await event.getByRole("button", { name: "Đăng ký tham gia" }).click();
  await expect(page.getByRole("status")).toContainText("Đã ghi nhận đăng ký");
});
