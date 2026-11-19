// Roles from the SRS (section 1). Guest = no session.
export const roles = ["customer", "support", "admin", "super_admin"] as const;
export type Role = (typeof roles)[number];
export const isRole = (value: unknown): value is Role =>
  roles.includes(value as Role);

const grants = {
  "orders:read": ["support", "admin", "super_admin"],
  "orders:write": ["admin", "super_admin"],
  "users:manage": ["super_admin"],
} as const satisfies Record<string, readonly Role[]>;
export type Permission = keyof typeof grants;

export const can = (role: Role, permission: Permission) =>
  (grants[permission] as readonly Role[]).includes(role);

export const orderStatuses = [
  "pending_confirmation",
  "pending_payment",
  "confirmed",
  "shipping",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export const isOrderStatus = (value: unknown): value is OrderStatus =>
  orderStatuses.includes(value as OrderStatus);
