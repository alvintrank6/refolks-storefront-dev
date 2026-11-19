import type { OrderStatus, Role } from "../auth/roles";

export type User = { id: string; email: string; name: string; role: Role };
/** A pending email code (stored hashed); one at a time per user. */
export type Otp = {
  purpose: "verify" | "reset";
  codeHash: string;
  expiresAt: string;
  attempts: number;
  sentAt: string;
};
export type UserRecord = User & {
  /** Empty for accounts created through Google until a password is set. */
  passwordHash: string;
  failedLogins: number;
  lockedUntil: string | null;
  /** Only `false` blocks sign-in; accounts from before verification existed have none. */
  emailVerified?: boolean;
  googleId?: string | null;
  otp?: Otp | null;
};
export type UserPatch = Partial<
  Pick<
    UserRecord,
    "passwordHash" | "emailVerified" | "googleId" | "otp" | "name"
  >
>;
export type OrderSummary = {
  number: string;
  createdAt: string;
  status: string;
  total: number;
  customerName: string;
  phone: string;
  email: string | null;
  address: string | null;
  items: { name: string; colour: string; qty: number; unitPrice: number }[];
};
export type NewUser = Omit<User, "id"> & {
  passwordHash: string;
  emailVerified?: boolean;
  googleId?: string | null;
};

export interface AccountRepository {
  /** Returns null when the email is already registered. */
  createUser(input: NewUser): Promise<User | null>;
  findUser(email: string): Promise<UserRecord | null>;
  setLoginState(
    id: string,
    failedLogins: number,
    lockedUntil: string | null,
  ): Promise<void>;
  createSession(
    tokenHash: string,
    userId: string,
    expiresAt: string,
  ): Promise<void>;
  sessionUser(tokenHash: string): Promise<User | null>;
  deleteSession(tokenHash: string): Promise<void>;
  listUsers(): Promise<User[]>;
  setRole(id: string, role: Role): Promise<boolean>;
  /** Setting passwordHash also clears the lock and signs the user out everywhere. */
  updateUser(id: string, patch: UserPatch): Promise<void>;
  /** All orders (newest first, max 200), or one customer's when userId is given. */
  listOrders(userId?: string): Promise<OrderSummary[]>;
  /** Cancelling releases reserved stock; a cancelled order is final. */
  setOrderStatus(
    number: string,
    status: OrderStatus,
  ): Promise<"ok" | "not_found" | "final">;
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  failed_logins: number;
  locked_until: string | null;
  email_verified: number;
  google_id: string | null;
  otp: string | null;
};
const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  role: r.role,
});

export class D1AccountRepository implements AccountRepository {
  constructor(private readonly db: D1Database) {}

  async createUser(input: NewUser) {
    const id = crypto.randomUUID();
    const result = await this.db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,name,password_hash,role,failed_logins,created_at,email_verified,google_id) VALUES (?,?,?,?,?,0,?,?,?)",
      )
      .bind(
        id,
        input.email,
        input.name,
        input.passwordHash,
        input.role,
        new Date().toISOString(),
        input.emailVerified === false ? 0 : 1,
        input.googleId ?? null,
      )
      .run();
    if (!result.meta.changes) return null;
    return { id, email: input.email, name: input.name, role: input.role };
  }

  async findUser(email: string) {
    const r = await this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(email)
      .first<UserRow>();
    return r
      ? {
          ...toUser(r),
          passwordHash: r.password_hash,
          failedLogins: r.failed_logins,
          lockedUntil: r.locked_until,
          emailVerified: r.email_verified !== 0,
          googleId: r.google_id,
          otp: r.otp ? (JSON.parse(r.otp) as Otp) : null,
        }
      : null;
  }

  async setLoginState(id: string, failed: number, lockedUntil: string | null) {
    await this.db
      .prepare(
        "UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?",
      )
      .bind(failed, lockedUntil, id)
      .run();
  }

  async createSession(tokenHash: string, userId: string, expiresAt: string) {
    await this.db
      .prepare(
        "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)",
      )
      .bind(tokenHash, userId, expiresAt)
      .run();
  }

  async sessionUser(tokenHash: string) {
    const r = await this.db
      .prepare(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?",
      )
      .bind(tokenHash, new Date().toISOString())
      .first<UserRow>();
    return r ? toUser(r) : null;
  }

  async deleteSession(tokenHash: string) {
    await this.db
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }

  async listUsers() {
    const { results } = await this.db
      .prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT 500")
      .all<UserRow>();
    return results.map(toUser);
  }

  async setRole(id: string, role: Role) {
    const result = await this.db
      .prepare("UPDATE users SET role = ? WHERE id = ?")
      .bind(role, id)
      .run();
    // Dropping sessions forces a fresh login under the new role.
    await this.db
      .prepare("DELETE FROM sessions WHERE user_id = ?")
      .bind(id)
      .run();
    return result.meta.changes > 0;
  }
  async updateUser(id: string, patch: UserPatch) {
    const columns: Record<keyof UserPatch, string> = {
      passwordHash: "password_hash",
      emailVerified: "email_verified",
      googleId: "google_id",
      otp: "otp",
      name: "name",
    };
    const keys = Object.keys(patch) as (keyof UserPatch)[];
    const values = keys.map((k) =>
      k === "emailVerified"
        ? patch[k]
          ? 1
          : 0
        : k === "otp"
          ? patch.otp
            ? JSON.stringify(patch.otp)
            : null
          : patch[k],
    );
    const sets = keys.map((k) => `${columns[k]} = ?`);
    if (patch.passwordHash !== undefined)
      sets.push("failed_logins = 0", "locked_until = NULL");
    const statements = [
      this.db
        .prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`)
        .bind(...values, id),
    ];
    if (patch.passwordHash !== undefined)
      statements.push(
        this.db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
      );
    if (sets.length) await this.db.batch(statements);
  }

  async listOrders(userId?: string) {
    const where = userId ? "WHERE user_id = ?" : "";
    const stmt = this.db.prepare(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT 200`,
    );
    const { results: orders } = await (userId ? stmt.bind(userId) : stmt).all<
      Record<string, string | number | null>
    >();
    if (!orders.length) return [];
    const ids = orders.map((o) => o.id);
    const { results: items } = await this.db
      .prepare(
        `SELECT * FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`,
      )
      .bind(...ids)
      .all<Record<string, string | number>>();
    return orders.map((o) => ({
      number: String(o.number),
      createdAt: String(o.created_at),
      status: String(o.status),
      total: Number(o.total),
      customerName: String(o.customer_name),
      phone: String(o.phone),
      email: (o.email as string | null) ?? null,
      address: (o.address as string | null) ?? null,
      items: items
        .filter((i) => i.order_id === o.id)
        .map((i) => ({
          name: String(i.name),
          colour: String(i.colour),
          qty: Number(i.qty),
          unitPrice: Number(i.unit_price),
        })),
    }));
  }

  async setOrderStatus(number: string, status: OrderStatus) {
    const order = await this.db
      .prepare("SELECT status FROM orders WHERE number = ?")
      .bind(number)
      .first<{ status: string }>();
    if (!order) return "not_found";
    if (order.status === "cancelled") return "final";
    // One batch = one transaction; the status guard stops a double restock.
    const update = this.db
      .prepare(
        "UPDATE orders SET status = ? WHERE number = ? AND status != 'cancelled'",
      )
      .bind(status, number);
    const results = await this.db.batch(
      status === "cancelled"
        ? [
            this.db
              .prepare(
                `UPDATE inventory SET stock = stock + (
                   SELECT SUM(oi.qty) FROM order_items oi JOIN orders o ON o.id = oi.order_id
                   WHERE o.number = ?1 AND oi.sku = inventory.sku)
                 WHERE sku IN (SELECT oi.sku FROM order_items oi JOIN orders o ON o.id = oi.order_id
                   WHERE o.number = ?1 AND o.status != 'cancelled')`,
              )
              .bind(number),
            update,
          ]
        : [update],
    );
    return results.at(-1)!.meta.changes ? "ok" : "final";
  }
}
