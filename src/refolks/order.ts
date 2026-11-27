import type { OrderLine } from "../lib/data/types";
import { colours, products } from "./data";

export type CheckoutItem = {
  id: string;
  qty: number;
  color: string;
  personal: boolean;
  variant?: string;
};

/** Prices from the server-side catalogue; returns null when any item is invalid. */
export function roundTwoLines(
  items: unknown,
  locale: "en" | "vi",
): OrderLine[] | null {
  if (!Array.isArray(items) || !items.length || items.length > 10) return null;
  const lines: OrderLine[] = [];
  for (const raw of items as Partial<CheckoutItem>[]) {
    const product = products.find((p) => p.id === raw?.id);
    if (
      !product ||
      product.price === null ||
      !Number.isInteger(raw.qty) ||
      raw.qty! < 1 ||
      raw.qty! > 10
    )
      return null;
    const productColors: readonly string[] = product.colors;
    const colorOk = productColors.length
      ? productColors.includes(raw.color ?? "")
      : !raw.color;
    const variant = product.variants.find((v) => v.key === raw.variant);
    if (!colorOk || (product.variants.length ? !variant : raw.variant))
      return null;
    const detail = [
      raw.color ? (colours[raw.color]?.name[locale] ?? raw.color) : "",
      variant?.label[locale] ?? "",
      raw.personal === true
        ? locale === "vi"
          ? "cá nhân hóa"
          : "personalised"
        : "",
    ].filter(Boolean);
    lines.push({
      // shortcut: one stock pool per product (catalogue has no per-colour stock); split SKUs when it does.
      sku: product.id,
      name: product.name[locale],
      colour: detail.join(" · ") || "-",
      qty: raw.qty!,
      unitPrice: product.price,
      stock: product.stock,
    });
  }
  return lines;
}
