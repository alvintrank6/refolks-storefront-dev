import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { OrderStatus, Role } from "../auth/roles";
import type {
  AccountRepository,
  NewUser,
  UserPatch,
  UserRecord,
} from "./account";
import { serialized } from "./local";

type LocalOrder = {
  number: string;
  createdAt: string;
  status?: string;
  total: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  userId?: string | null;
  lines: {
    sku: string;
    name: string;
    colour: string;
    qty: number;
    unitPrice: number;
  }[];
};
type LocalAccounts = {
  users: UserRecord[];
  sessions: { tokenHash: string; userId: string; expiresAt: string }[];
};

/** File-backed development adapter (`.data/accounts.json`, orders in `store.json`). */
export class LocalAccountRepository implements AccountRepository {
  constructor(private readonly directory = process.env.DATA_DIR ?? ".data") {}

  private async read<T>(file: string, empty: T): Promise<T> {
    const text = await readFile(join(this.directory, file), "utf8").catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      },
    );
    return text ? (JSON.parse(text) as T) : empty;
  }
  private async write(file: string, data: unknown) {
    await mkdir(this.directory, { recursive: true });
    const path = join(this.directory, file);
    const temp = `${path}.${crypto.randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(data), "utf8");
    await rename(temp, path);
  }
  private accounts = () =>
    this.read<LocalAccounts>("accounts.json", { users: [], sessions: [] });
  private change<T>(action: (data: LocalAccounts) => T) {
    return serialized(async () => {
      const data = await this.accounts();
      const result = action(data);
      await this.write("accounts.json", data);
      return result;
    });
  }

  createUser(input: NewUser) {
    return this.change((data) => {
      if (data.users.some((u) => u.email === input.email)) return null;
      const user = { ...input, id: crypto.randomUUID() };
      data.users.push({ ...user, failedLogins: 0, lockedUntil: null });
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    });
  }
  async findUser(email: string) {
    return (await this.accounts()).users.find((u) => u.email === email) ?? null;
  }
  async setLoginState(id: string, failed: number, lockedUntil: string | null) {
    await this.change((data) => {
      const user = data.users.find((u) => u.id === id);
      if (user) Object.assign(user, { failedLogins: failed, lockedUntil });
    });
  }
  async createSession(tokenHash: string, userId: string, expiresAt: string) {
    await this.change((data) => {
      const now = new Date().toISOString();
      data.sessions = data.sessions.filter((s) => s.expiresAt > now);
      data.sessions.push({ tokenHash, userId, expiresAt });
    });
  }
  async sessionUser(tokenHash: string) {
    const data = await this.accounts();
    const session = data.sessions.find(
      (s) =>
        s.tokenHash === tokenHash && s.expiresAt > new Date().toISOString(),
    );
    const user = session && data.users.find((u) => u.id === session.userId);
    return user
      ? { id: user.id, email: user.email, name: user.name, role: user.role }
      : null;
  }
  async deleteSession(tokenHash: string) {
    await this.change((data) => {
      data.sessions = data.sessions.filter((s) => s.tokenHash !== tokenHash);
    });
  }
  async listUsers() {
    return (await this.accounts()).users.map(({ id, email, name, role }) => ({
      id,
      email,
      name,
      role,
    }));
  }
  setRole(id: string, role: Role) {
    return this.change((data) => {
      const user = data.users.find((u) => u.id === id);
      if (!user) return false;
      user.role = role;
      data.sessions = data.sessions.filter((s) => s.userId !== id);
      return true;
    });
  }

  private store = () =>
    this.read<{ inventory: Record<string, number>; orders: LocalOrder[] }>(
      "store.json",
      { inventory: {}, orders: [] },
    );
  async listOrders(userId?: string) {
    return (await this.store()).orders
      .filter((o) => !userId || o.userId === userId)
      .reverse()
      .slice(0, 200)
      .map((o) => ({
        number: o.number,
        createdAt: o.createdAt,
        status: o.status ?? "pending_confirmation",
        total: o.total,
        customerName: o.name,
        phone: o.phone,
        email: o.email,
        address: o.address,
        items: (o.lines ?? []).map(({ name, colour, qty, unitPrice }) => ({
          name,
          colour,
          qty,
          unitPrice,
        })),
      }));
  }
  async updateUser(id: string, patch: UserPatch) {
    await this.change((data) => {
      const user = data.users.find((u) => u.id === id);
      if (!user) return;
      Object.assign(user, patch);
      if (patch.passwordHash !== undefined) {
        Object.assign(user, { failedLogins: 0, lockedUntil: null });
        data.sessions = data.sessions.filter((s) => s.userId !== id);
      }
    });
  }
  setOrderStatus(number: string, status: OrderStatus) {
    return serialized(async () => {
      const store = await this.store();
      const order = store.orders.find((o) => o.number === number);
      if (!order) return "not_found" as const;
      if (order.status === "cancelled") return "final" as const;
      if (status === "cancelled")
        for (const line of order.lines ?? [])
          store.inventory[line.sku] =
            (store.inventory[line.sku] ?? 0) + line.qty;
      order.status = status;
      await this.write("store.json", store);
      return "ok" as const;
    });
  }
}
