import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./crypto";
import { can } from "./roles";

describe("password hashing", () => {
  it("verifies the right password only", async () => {
    const stored = await hashPassword("correct horse");
    expect(stored).toMatch(/^pbkdf2\$100000\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    expect(await verifyPassword("correct horse", stored)).toBe(true);
    expect(await verifyPassword("correct hors", stored)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });
});

describe("role grants", () => {
  it("matches the SRS role ladder", () => {
    expect(can("customer", "orders:read")).toBe(false);
    expect(can("support", "orders:read")).toBe(true);
    expect(can("support", "orders:write")).toBe(false);
    expect(can("admin", "orders:write")).toBe(true);
    expect(can("admin", "users:manage")).toBe(false);
    expect(can("super_admin", "users:manage")).toBe(true);
  });
});
