import type { Product, Locale } from "../catalog";
import type { DonationRepository } from "./donation";

/** Server-priced line. `stock` seeds inventory the first time a SKU is sold. */
export type OrderLine = {
  sku: string;
  name: string;
  colour: string;
  qty: number;
  unitPrice: number;
  stock: number;
};

export type OrderDraft = {
  lines: OrderLine[];
  locale: Locale;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: "hanoi" | "other";
  delivery: "ship" | "pickup";
  payment: "cod" | "transfer";
  /** Signed-in customer, so the order shows in their account. */
  userId?: string | null;
};

export type OrderCreated = {
  token: string;
  number: string;
  subtotal: number;
  shipping: number;
  total: number;
};
export type VisitDraft = {
  name: string;
  phone: string;
  email: string | null;
  date: string;
  time: string;
  bag: string | null;
  note: string | null;
  locale: Locale;
  ipHash?: string | null;
};
export type MessageDraft = {
  name: string;
  contact: string;
  topic: string;
  orderNumber: string | null;
  body: string;
  locale: Locale;
  ipHash?: string | null;
};

export interface StoreRepository extends DonationRepository {
  getProducts(): Promise<Product[]>;
  getProduct(handle: string): Promise<Product | null>;
  placeOrder(input: OrderDraft): Promise<OrderCreated>;
  createVisit(input: VisitDraft): Promise<void>;
  getBookedVisitSlots(date: string): Promise<string[]>;
  createMessage(input: MessageDraft): Promise<void>;
}
