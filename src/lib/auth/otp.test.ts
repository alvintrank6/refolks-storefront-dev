import { mkdir, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { LocalAccountRepository } from "../data/account-local";
import { googleUser, readIdToken } from "./google";
import { checkOtp, issueOtp } from "./otp";

const sent: string[] = [];
vi.mock("../email", () => ({
  sendTransactionalEmail: async (m: { text: string }) => {
    sent.push(m.text);
    return true;
  },
}));
const lastCode = () => /(\d{6})/.exec(sent.at(-1)!)![1];

let accounts: LocalAccountRepository;
beforeAll(async () => {
  const parent = join(process.cwd(), "test-results");
  await mkdir(parent, { recursive: true });
  accounts = new LocalAccountRepository(await mkdtemp(join(parent, "otp-")));
});
const newUser = async (email: string, extra = {}) => {
  await accounts.createUser({
    email,
    name: "A",
    role: "customer",
    passwordHash: "x",
    ...extra,
  });
  return (await accounts.findUser(email))!;
};
const fresh = async (email: string) => (await accounts.findUser(email))!;

describe("email codes", () => {
  it("accepts the right code once, for its purpose only", async () => {
    const user = await newUser("otp1@example.test");
    expect(await issueOtp(accounts, user, "verify", "en")).toBe("sent");
    const code = lastCode();
    expect(
      await checkOtp(accounts, await fresh(user.email), "reset", code),
    ).toBe(false);
    expect(
      await checkOtp(accounts, await fresh(user.email), "verify", code),
    ).toBe(true);
    expect(
      await checkOtp(accounts, await fresh(user.email), "verify", code),
    ).toBe(false);
  });

  it("enforces resend cooldown, expiry and 5 attempts", async () => {
    const user = await newUser("otp2@example.test");
    const t = Date.now();
    await issueOtp(accounts, user, "reset", "vi", t);
    expect(
      await issueOtp(
        accounts,
        await fresh(user.email),
        "reset",
        "vi",
        t + 30_000,
      ),
    ).toBe("cooldown");
    const code = lastCode();
    expect(
      await checkOtp(
        accounts,
        await fresh(user.email),
        "reset",
        code,
        t + 11 * 60_000,
      ),
    ).toBe(false);
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++)
      expect(
        await checkOtp(accounts, await fresh(user.email), "reset", wrong, t),
      ).toBe(false);
    // Five misses burn the code, so even the right one now fails.
    expect(
      await checkOtp(accounts, await fresh(user.email), "reset", code, t),
    ).toBe(false);
  });

  it("a password change signs out every session", async () => {
    const user = await newUser("otp3@example.test");
    await accounts.createSession(
      "s1",
      user.id,
      new Date(Date.now() + 60_000).toISOString(),
    );
    await accounts.updateUser(user.id, { passwordHash: "new" });
    expect(await accounts.sessionUser("s1")).toBeNull();
  });
});

const token = (claims: object) =>
  `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.sig`;
const claims = {
  iss: "https://accounts.google.com",
  aud: "client",
  sub: "g-1",
  email: "Google@example.test",
  email_verified: true,
  name: "Nguyễn Văn A",
  nonce: "n",
  exp: Math.floor(Date.now() / 1000) + 600,
};

describe("google sign-in", () => {
  it("validates audience, nonce, expiry and verified email; keeps UTF-8 names", () => {
    expect(readIdToken(token(claims), "client", "n")?.name).toBe(
      "Nguyễn Văn A",
    );
    expect(readIdToken(token(claims), "other", "n")).toBeNull();
    expect(readIdToken(token(claims), "client", "x")).toBeNull();
    expect(
      readIdToken(token({ ...claims, email_verified: false }), "client", "n"),
    ).toBeNull();
    expect(readIdToken(token({ ...claims, exp: 1 }), "client", "n")).toBeNull();
    expect(readIdToken("garbage", "client", "n")).toBeNull();
  });

  it("creates a verified customer, then links by email for existing accounts", async () => {
    const created = await googleUser(accounts, claims);
    expect(created?.role).toBe("customer");
    expect((await fresh("google@example.test")).passwordHash).toBe("");

    const admin = await newUser("staff@example.test", {
      role: "admin",
      emailVerified: false,
    });
    const linked = await googleUser(accounts, {
      ...claims,
      sub: "g-2",
      email: "staff@example.test",
    });
    expect(linked?.id).toBe(admin.id);
    expect((await fresh("staff@example.test")).emailVerified).toBe(true);
    // A different Google account for the same address is refused.
    expect(
      await googleUser(accounts, {
        ...claims,
        sub: "g-3",
        email: "staff@example.test",
      }),
    ).toBeNull();
  });
});
