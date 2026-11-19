import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const inventory = sqliteTable("inventory", {
  sku: text("sku").primaryKey(),
  stock: integer("stock").notNull(),
});
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    number: text("number").notNull(),
    createdAt: text("created_at").notNull(),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    paymentMethod: text("payment_method").notNull(),
    delivery: text("delivery").notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address"),
    city: text("city"),
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull(),
    total: integer("total").notNull(),
    customerMarkedPaidAt: text("customer_marked_paid_at"),
    userId: text("user_id"),
  },
  (table) => [
    uniqueIndex("orders_token_unique").on(table.token),
    uniqueIndex("orders_number_unique").on(table.number),
  ],
);
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  colour: text("colour").notNull(),
  qty: integer("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
});
export const visits = sqliteTable(
  "studio_visits",
  {
    id: text("id").primaryKey(),
    createdAt: text("created_at").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    visitDate: text("visit_date").notNull(),
    visitTime: text("visit_time").notNull(),
    bag: text("bag"),
    note: text("note"),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    ipHash: text("ip_hash"),
  },
  (table) => [
    uniqueIndex("visits_slot_unique").on(table.visitDate, table.visitTime),
  ],
);
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  topic: text("topic").notNull(),
  orderNumber: text("order_number"),
  body: text("body").notNull(),
  locale: text("locale").notNull(),
  status: text("status").notNull(),
  ipHash: text("ip_hash"),
});

export const donationEvents = sqliteTable("donation_events", {
  id: text("id").primaryKey(),
  date: text("date"),
  collectionWindowEn: text("collection_window_en"),
  collectionWindowVi: text("collection_window_vi"),
  destinationEn: text("destination_en"),
  destinationVi: text("destination_vi"),
  status: text("status").notNull(),
  kgCollected: integer("kg_collected"),
  piecesDelivered: integer("pieces_delivered"),
  kgRecycled: integer("kg_recycled"),
  createdAt: text("created_at").notNull(),
});
export const donationSignups = sqliteTable("donation_signups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  role: text("role").notNull(),
  amount: text("amount"),
  note: text("note"),
  consentPrivacy: integer("consent_privacy", { mode: "boolean" }).notNull(),
  consentRecycle: integer("consent_recycle", { mode: "boolean" }).notNull(),
  locale: text("locale").notNull(),
  eventId: text("event_id"),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  ipHash: text("ip_hash"),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull(),
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: text("locked_until"),
    createdAt: text("created_at").notNull(),
    emailVerified: integer("email_verified").notNull().default(1),
    googleId: text("google_id"),
    /** JSON of the pending email code (see Otp in src/lib/data/account.ts). */
    otp: text("otp"),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);
export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: text("expires_at").notNull(),
});
