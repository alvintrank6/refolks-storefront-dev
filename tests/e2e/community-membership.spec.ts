import { expect, test } from "@playwright/test";

test("community membership dashboard matches the Site layout responsively", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/vi/community");

  await expect(
    page.getByRole("heading", { level: 1, name: "Tài khoản & Kho voucher cho bạn" }),
  ).toBeVisible();
  await expect(page.locator(".rf-benefits-card")).toHaveCount(4);

  const address = `community-${Date.now()}@example.test`;
  await page.getByRole("button", { name: "Đăng nhập / Đăng ký" }).click();
  const dialog = page.getByRole("dialog", { name: "Tài khoản" });
  await dialog.getByRole("button", { name: "Tạo tài khoản" }).first().click();
  await dialog.getByLabel("Họ và tên").fill("Mai Anh");
  await dialog.getByLabel("Email").fill(address);
  await dialog.getByLabel("Mật khẩu").fill("community-test-password");
  await dialog.getByRole("button", { name: "Tạo tài khoản" }).last().click();

  await expect(page.locator(".rf-benefits")).toContainText("Mai Anh");
  await expect(page.locator(".rf-benefits")).toContainText(address);
  await expect(page.locator(".rf-benefits")).toContainText("NEW15");
  await expect(page.locator(".rf-benefits")).toContainText("0 kg");

  const desktopColumns = await page
    .locator(".rf-benefits")
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  expect(desktopColumns).toBe(2);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileColumns = await page
    .locator(".rf-benefits")
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(mobileColumns).toBe(1);
  expect(overflow).toBeLessThanOrEqual(1);
});
