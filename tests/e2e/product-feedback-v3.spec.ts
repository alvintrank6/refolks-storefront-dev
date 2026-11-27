import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("refolks-member-dismissed", String(Date.now()));
    localStorage.setItem("refolks-event-dismissed", String(Date.now()));
  });
});

test("feedback product photos, prices and Coming soon state work across layouts", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/vi/shop");
    await expect(page.locator(".rf-shop-grid .rf-product-card")).toHaveCount(6);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `shop at ${width}px`).toBeLessThanOrEqual(1);
  }

  const bagPrices: Record<string, string> = {
    "the-herald": "1.590.000₫",
    "the-curator": "1.590.000₫",
    "the-vanguard": "1.890.000₫",
    "the-navigator": "1.590.000₫",
  };
  for (const [id, price] of Object.entries(bagPrices)) {
    await expect(
      page.locator(`.rf-product-card.rf-${id} .rf-card-bottom strong`),
    ).toHaveText(price);
  }

  await page.goto("/vi/accessories");
  await expect(page.locator(".rf-shop-grid .rf-product-card")).toHaveCount(5);
  await expect(page.locator(".rf-shop-grid .rf-card-bottom strong")).toHaveText(
    Array(5).fill("Coming soon"),
  );
  await expect(
    page.locator(".rf-shop-grid .rf-card-bottom button:disabled"),
  ).toHaveCount(5);
  const brokenImages = await page
    .locator(".rf-shop-grid .rf-card-main")
    .evaluateAll((images) =>
      images.filter((image) => (image as HTMLImageElement).naturalWidth === 0)
        .length,
    );
  expect(brokenImages).toBe(0);

  await page.goto("/vi/products/the-weaver");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Weaver");
  await expect(page.locator(".rf-price")).toHaveText("Coming soon");
  await expect(page.locator(".rf-pdp-buy .rf-button")).toBeDisabled();
});
