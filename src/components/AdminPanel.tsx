"use client";

import { useEffect, useState } from "react";
import { orderStatuses, roles, type Role } from "../lib/auth/roles";
import type { OrderSummary, User } from "../lib/data/account";
import type { Lang } from "../refolks/data";

const statusLabels: Record<string, [vi: string, en: string]> = {
  pending_confirmation: ["Chờ xác nhận", "Awaiting confirmation"],
  pending_payment: ["Chờ thanh toán", "Awaiting payment"],
  confirmed: ["Đã xác nhận", "Confirmed"],
  shipping: ["Đang giao", "Shipping"],
  completed: ["Hoàn tất", "Completed"],
  cancelled: ["Đã hủy", "Cancelled"],
};
export const statusLabel = (status: string, lang: Lang) =>
  statusLabels[status]?.[lang === "vi" ? 0 : 1] ?? status;

const money = (n: number) => `${n.toLocaleString("vi-VN")}₫`;
const send = (url: string, body: unknown) =>
  fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/** Staff view: orders for support+, status changes for admin+, roles for super_admin. */
export function AdminPanel({ lang, role }: { lang: Lang; role: Role }) {
  const vi = lang === "vi";
  const canWrite = role === "admin" || role === "super_admin";
  const canManageUsers = role === "super_admin";
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [notice, setNotice] = useState("");

  const [version, setVersion] = useState(0);
  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ orders: OrderSummary[] }>)
          : { orders: [] },
      )
      .then(
        (data) => setOrders(data.orders),
        () => setOrders([]),
      );
    if (canManageUsers)
      fetch("/api/admin/users")
        .then((res) =>
          res.ok ? (res.json() as Promise<{ users: User[] }>) : { users: [] },
        )
        .then(
          (data) => setUsers(data.users),
          () => setUsers([]),
        );
  }, [canManageUsers, version]);

  const act = async (request: Promise<Response>) => {
    const res = await request.catch(() => null);
    setNotice(
      res?.ok
        ? vi
          ? "Đã cập nhật."
          : "Updated."
        : res?.status === 409
          ? vi
            ? "Không thể thay đổi (đơn đã hủy hoặc tài khoản của chính bạn)."
            : "Not allowed (cancelled order or your own account)."
          : vi
            ? "Cập nhật thất bại."
            : "Update failed.",
    );
    setVersion((v) => v + 1);
  };

  return (
    <main className="rf-page rf-account-page rf-admin">
      <span className="rf-eyebrow">REFOLKS / ADMIN</span>
      <h1>{vi ? "Quản trị" : "Admin"}</h1>
      <p role="status" aria-live="polite">
        {notice}
      </p>
      <section>
        <h2>{vi ? "Đơn hàng" : "Orders"}</h2>
        {orders === null ? (
          <p>{vi ? "Đang tải…" : "Loading…"}</p>
        ) : orders.length === 0 ? (
          <p>{vi ? "Chưa có đơn hàng." : "No orders yet."}</p>
        ) : (
          orders.map((o) => (
            <div className="rf-order" key={o.number} data-order={o.number}>
              <strong>{o.number}</strong>
              <span>
                {new Date(o.createdAt).toLocaleString(vi ? "vi-VN" : "en-GB")}
              </span>
              <span>
                {o.customerName} · {o.phone}
                {o.email ? ` · ${o.email}` : ""}
              </span>
              <span>
                {o.items
                  .map((i) => `${i.name} (${i.colour}) × ${i.qty}`)
                  .join(", ")}
              </span>
              <strong>{money(o.total)}</strong>
              {canWrite && o.status !== "cancelled" ? (
                <label className="rf-field">
                  <span>{vi ? "Trạng thái" : "Status"}</span>
                  <select
                    value={o.status}
                    onChange={(e) =>
                      act(
                        send("/api/admin/orders", {
                          number: o.number,
                          status: e.target.value,
                        }),
                      )
                    }
                  >
                    {orderStatuses.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s, lang)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span>{statusLabel(o.status, lang)}</span>
              )}
            </div>
          ))
        )}
      </section>
      {canManageUsers && (
        <section>
          <h2>{vi ? "Tài khoản & phân quyền" : "Accounts & roles"}</h2>
          {users.map((u) => (
            <div className="rf-order" key={u.id} data-user={u.email}>
              <strong>{u.name}</strong>
              <span>{u.email}</span>
              <label className="rf-field">
                <span>{vi ? "Vai trò" : "Role"}</span>
                <select
                  value={u.role}
                  onChange={(e) =>
                    act(
                      send("/api/admin/users", {
                        id: u.id,
                        role: e.target.value,
                      }),
                    )
                  }
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
