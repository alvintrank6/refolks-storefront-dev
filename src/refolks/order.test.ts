import { describe, expect, it } from "vitest";
import { products } from "./data";
import { roundTwoLines } from "./order";

const herald = products.find((p) => p.id === "the-herald")!;
const vanguard = products.find((p) => p.id === "the-vanguard")!;
const storyteller = products.find((p) => p.id === "the-storyteller")!;

describe("roundTwoLines", () => {
  it("prices items from the server catalogue", () => {
    const lines = roundTwoLines(
      [
        {
          id: herald.id,
          qty: 2,
          color: herald.colors[0],
          personal: false,
          price: 1,
        },
      ],
      "en",
    );
    expect(lines).toEqual([
      expect.objectContaining({
        sku: herald.id,
        qty: 2,
        unitPrice: herald.price,
      }),
    ]);
  });

  it("requires a valid variant when the product has variants", () => {
    const base = {
      id: vanguard.id,
      qty: 1,
      color: vanguard.colors[0],
      personal: false,
    };
    expect(roundTwoLines([base], "vi")).toBeNull();
    expect(
      roundTwoLines([{ ...base, variant: vanguard.variants[0].key }], "vi"),
    ).toHaveLength(1);
  });

  it("rejects unknown products, colours and bad quantities", () => {
    expect(
      roundTwoLines([{ id: "nope", qty: 1, color: "", personal: false }], "en"),
    ).toBeNull();
    expect(
      roundTwoLines(
        [{ id: herald.id, qty: 1, color: "pink", personal: false }],
        "en",
      ),
    ).toBeNull();
    expect(
      roundTwoLines(
        [{ id: herald.id, qty: 0, color: herald.colors[0], personal: false }],
        "en",
      ),
    ).toBeNull();
    expect(roundTwoLines([], "en")).toBeNull();
  });

  it("rejects products whose price is still coming soon", () => {
    expect(
      roundTwoLines(
        [{ id: storyteller.id, qty: 1, color: "brown", personal: false }],
        "vi",
      ),
    ).toBeNull();
  });
});
