import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { products } from "./data";

describe("November product feedback catalogue", () => {
  it("uses the four approved bag prices and labels every secondary product Coming soon", () => {
    const prices = Object.fromEntries(
      products.slice(0, 4).map((product) => [product.id, product.price]),
    );
    expect(prices).toEqual({
      "the-herald": 1_590_000,
      "the-curator": 1_590_000,
      "the-vanguard": 1_890_000,
      "the-navigator": 1_590_000,
    });

    const secondaryProducts = products.slice(4);
    expect(secondaryProducts).toHaveLength(7);
    expect(secondaryProducts.every((product) => product.price === null)).toBe(
      true,
    );
    expect(secondaryProducts.every((product) => product.stock === 0)).toBe(
      true,
    );
  });

  it("points every product gallery at a supplied image file", () => {
    expect(products).toHaveLength(11);
    for (const product of products) {
      expect(product.images.length, product.id).toBeGreaterThan(0);
      for (const image of product.images) {
        expect(existsSync(resolve(process.cwd(), "public", image.slice(1)))).toBe(
          true,
        );
      }
    }
  });
});
