import { MongoClient, MongoServerError, type Db } from "mongodb";
import { policy } from "../../content/policy";
import type { OrderStatus, Role } from "../auth/roles";
import type {
  AccountRepository,
  NewUser,
  OrderSummary,
  User,
  UserPatch,
  UserRecord,
} from "./account";
import type { DonationSignup } from "./donation";
import type {
  MessageDraft,
  OrderCreated,
  OrderDraft,
  VisitDraft,
} from "./types";

type UserDoc = Omit<UserRecord, "id"> & { _id: string; createdAt: string };
type SessionDoc = { _id: string; userId: string; expiresAt: Date };
type OrderDoc = Omit<OrderSummary, "items"> & {
  _id: string;
  token: string;
  locale: string;
  paymentMethod: string;
  delivery: string;
  city: string;
  subtotal: number;
  shippingFee: number;
  userId: string | null;
  items: (OrderSummary["items"][number] & { sku: string })[];
};
type InventoryDoc = { _id: string; stock: number };
type IntakeDoc = {
  _id: string;
  createdAt: string;
  ipHash: string | null;
  [field: string]: unknown;
};
type VisitDoc = IntakeDoc & { date: string; time: string; status: string };

let nodeClient: Promise<MongoClient> | undefined;
/**
 * Node keeps one pooled client per process. A Worker cannot reuse sockets across
 * requests, so it opens a fresh client per call (~300 ms, fine for this traffic).
 */
async function connect(uri: string, worker: boolean) {
  if (worker) return new MongoClient(uri, { maxPoolSize: 1 }).connect();
  nodeClient ??= new MongoClient(uri).connect();
  return nodeClient;
}

// Indexes (unique email/order number, session TTL) come from scripts/mongo-setup.mjs.

const toUser = (d: UserDoc): User => ({
  id: d._id,
  email: d.email,
  name: d.name,
  role: d.role,
});

export class MongoRepository implements AccountRepository {
  constructor(
    private readonly client: MongoClient,
    private readonly db: Db,
  ) {}

  static async open(uri: string, dbName: string, worker: boolean) {
    const client = await connect(uri, worker);
    return new MongoRepository(client, client.db(dbName));
  }

  private users = () => this.db.collection<UserDoc>("users");
  private sessions = () => this.db.collection<SessionDoc>("sessions");
  private orders = () => this.db.collection<OrderDoc>("orders");
  private inventory = () => this.db.collection<InventoryDoc>("inventory");
  private intake = <T extends IntakeDoc>(name: string) =>
    this.db.collection<T>(name);

  /** Same hourly per-IP limits as the D1 adapter. */
  private async overLimit(
    name: string,
    ipHash: string | null | undefined,
    max: number,
    now = Date.now(),
  ) {
    if (!ipHash) return false;
    const since = new Date(now - 3_600_000).toISOString();
    return (
      (await this.intake(name).countDocuments({
        ipHash,
        createdAt: { $gte: since },
      })) >= max
    );
  }

  async createMessage(input: MessageDraft) {
    if (await this.overLimit("messages", input.ipHash, 5))
      throw new Error("RATE_LIMITED");
    await this.intake("messages").insertOne({
      _id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
      ipHash: input.ipHash ?? null,
      status: "new",
    });
  }

  async createVisit(input: VisitDraft) {
    if (await this.overLimit("visits", input.ipHash, 3))
      throw new Error("RATE_LIMITED");
    await this.intake("visits").insertOne({
      _id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
      ipHash: input.ipHash ?? null,
      status: "requested",
    });
  }

  async getBookedVisitSlots(date: string) {
    const docs = await this.intake<VisitDoc>("visits")
      .find({ date, status: { $ne: "cancelled" } })
      .project<{ time: string }>({ time: 1 })
      .toArray();
    return docs.map((d) => d.time);
  }

  async register(input: DonationSignup): Promise<"saved" | "rate_limited"> {
    if (
      await this.overLimit(
        "donationSignups",
        input.ipHash,
        3,
        Date.parse(input.createdAt),
      )
    )
      return "rate_limited";
    const { id, ...rest } = input;
    await this.intake("donationSignups").insertOne({ _id: id, ...rest });
    return "saved";
  }

  async createUser(input: NewUser) {
    const doc: UserDoc = {
      _id: crypto.randomUUID(),
      ...input,
      failedLogins: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
    };
    try {
      await this.users().insertOne(doc);
    } catch (error) {
      // The unique email index makes concurrent duplicate sign-ups safe.
      if (error instanceof MongoServerError && error.code === 11000)
        return null;
      throw error;
    }
    return toUser(doc);
  }

  async findUser(email: string) {
    const d = await this.users().findOne({ email });
    return d
      ? {
          ...toUser(d),
          passwordHash: d.passwordHash,
          failedLogins: d.failedLogins,
          lockedUntil: d.lockedUntil,
          emailVerified: d.emailVerified,
          googleId: d.googleId ?? null,
          otp: d.otp ?? null,
        }
      : null;
  }

  async setLoginState(id: string, failed: number, lockedUntil: string | null) {
    await this.users().updateOne(
      { _id: id },
      { $set: { failedLogins: failed, lockedUntil } },
    );
  }

  async createSession(tokenHash: string, userId: string, expiresAt: string) {
    await this.sessions().insertOne({
      _id: tokenHash,
      userId,
      expiresAt: new Date(expiresAt),
    });
  }

  async sessionUser(tokenHash: string) {
    // The TTL index deletes expired sessions within ~60 s; the date filter covers that gap.
    const session = await this.sessions().findOne({
      _id: tokenHash,
      expiresAt: { $gt: new Date() },
    });
    const user =
      session && (await this.users().findOne({ _id: session.userId }));
    return user ? toUser(user) : null;
  }

  async deleteSession(tokenHash: string) {
    await this.sessions().deleteOne({ _id: tokenHash });
  }

  async listUsers() {
    return (
      await this.users().find().sort({ createdAt: -1 }).limit(500).toArray()
    ).map(toUser);
  }

  async setRole(id: string, role: Role) {
    const result = await this.users().updateOne(
      { _id: id },
      { $set: { role } },
    );
    await this.sessions().deleteMany({ userId: id });
    return result.matchedCount > 0;
  }

  async updateUser(id: string, patch: UserPatch) {
    const reset = patch.passwordHash !== undefined;
    await this.users().updateOne(
      { _id: id },
      {
        $set: reset ? { ...patch, failedLogins: 0, lockedUntil: null } : patch,
      },
    );
    if (reset) await this.sessions().deleteMany({ userId: id });
  }

  async listOrders(userId?: string) {
    const docs = await this.orders()
      .find(userId ? { userId } : {})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    return docs.map((o) => ({
      number: o.number,
      createdAt: o.createdAt,
      status: o.status,
      total: o.total,
      customerName: o.customerName,
      phone: o.phone,
      email: o.email,
      address: o.address,
      items: o.items.map(({ name, colour, qty, unitPrice }) => ({
        name,
        colour,
        qty,
        unitPrice,
      })),
    }));
  }

  async setOrderStatus(number: string, status: OrderStatus) {
    const order = await this.orders().findOne({ number });
    if (!order) return "not_found";
    if (order.status === "cancelled") return "final";
    let result: "ok" | "final" = "final";
    await this.client.withSession((session) =>
      session.withTransaction(async () => {
        // The status guard inside the transaction stops a double restock.
        const updated = await this.orders().updateOne(
          { number, status: { $ne: "cancelled" } },
          { $set: { status } },
          { session },
        );
        result = updated.matchedCount ? "ok" : "final";
        if (result === "ok" && status === "cancelled")
          for (const item of order.items)
            await this.inventory().updateOne(
              { _id: item.sku },
              { $inc: { stock: item.qty } },
              { session },
            );
      }),
    );
    return result;
  }

  async placeOrder(input: OrderDraft): Promise<OrderCreated> {
    const rows = input.lines;
    if (!rows.length) throw new Error("EMPTY_CART");
    const subtotal = rows.reduce((sum, r) => sum + r.unitPrice * r.qty, 0);
    const shipping =
      input.delivery === "pickup"
        ? 0
        : input.city === "hanoi"
          ? policy.shippingFeeHanoi
          : policy.shippingFeeOther;
    const total = subtotal + shipping;
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const number = `RV${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    await this.client.withSession((session) =>
      session.withTransaction(async () => {
        for (const row of rows) {
          // First sale of a SKU seeds its stock from the catalogue.
          await this.inventory().updateOne(
            { _id: row.sku },
            { $setOnInsert: { stock: row.stock } },
            { upsert: true, session },
          );
          const reserved = await this.inventory().updateOne(
            { _id: row.sku, stock: { $gte: row.qty } },
            { $inc: { stock: -row.qty } },
            { session },
          );
          if (!reserved.modifiedCount) throw new Error("OUT_OF_STOCK"); // aborts the transaction
        }
        await this.orders().insertOne(
          {
            _id: crypto.randomUUID(),
            number,
            token,
            createdAt: new Date().toISOString(),
            locale: input.locale,
            status:
              input.payment === "cod"
                ? "pending_confirmation"
                : "pending_payment",
            paymentMethod: input.payment,
            delivery: input.delivery,
            customerName: input.name,
            phone: input.phone,
            email: input.email,
            address: input.address,
            city: input.city,
            subtotal,
            shippingFee: shipping,
            total,
            userId: input.userId ?? null,
            items: rows.map(({ sku, name, colour, qty, unitPrice }) => ({
              sku,
              name,
              colour,
              qty,
              unitPrice,
            })),
          },
          { session },
        );
      }),
    );
    return { token, number, subtotal, shipping, total };
  }
}
