import { NextRequest, NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "../../../../src/lib/auth/crypto";
import { checkOtp, issueOtp } from "../../../../src/lib/auth/otp";
import {
  currentUser,
  endSession,
  jsonBody,
  startSession,
} from "../../../../src/lib/auth/session";
import { accountRepository } from "../../../../src/lib/data";
import type { UserRecord } from "../../../../src/lib/data/account";
import { emailConfigured } from "../../../../src/lib/email";

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60_000;
// Hashed lazily; checked when the email is unknown so both paths cost the same time.
let dummyHash: Promise<string> | undefined;
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });
const publicUser = (u: { name: string; email: string; role: string }) => ({
  name: u.name,
  email: u.email,
  role: u.role,
});
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPassword = (p: string) => p.length >= 8 && p.length <= 200;

type Params = { params: Promise<{ action: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  if ((await params).action !== "me") return fail("not_found", 404);
  const user = await currentUser(request);
  return NextResponse.json({
    user: user && publicUser(user),
    // Lets the UI hide the Google button and forgot-password link when unconfigured.
    features: {
      google: !!process.env.GOOGLE_CLIENT_ID,
      email: emailConfigured(),
    },
  });
}

const signedIn = async (
  user: UserRecord | { id: string; name: string; email: string; role: string },
) => {
  const response = NextResponse.json({ user: publicUser(user) });
  await startSession(response, user.id);
  return response;
};

/** Sends a code; "verify" is returned to the UI so it shows the code step. */
async function sendCode(
  user: UserRecord,
  purpose: "verify" | "reset",
  locale: "vi" | "en",
) {
  try {
    const result = await issueOtp(
      await accountRepository(),
      user,
      purpose,
      locale,
    );
    return result === "cooldown" ? "cooldown" : "sent";
  } catch (error) {
    console.error("Email code failed", String(error));
    return "error";
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { action } = await params;
  if (action === "logout") {
    const response = NextResponse.json({ ok: true });
    await endSession(request, response);
    return response;
  }
  if (
    !["signup", "login", "verify", "resend", "forgot", "reset"].includes(action)
  )
    return fail("not_found", 404);

  const body = await jsonBody(request);
  if (!body) return fail("details");
  const email = text(body.email, 150).toLowerCase();
  if (!isEmail(email)) return fail("email");
  const locale = body.locale === "vi" ? "vi" : "en";
  const accounts = await accountRepository();

  // Code steps: verify signup, resend it, request and apply a password reset.
  if (action === "verify" || action === "reset") {
    const code = text(body.code, 6);
    const password = typeof body.password === "string" ? body.password : "";
    if (action === "reset" && !validPassword(password)) return fail("password");
    const user = await accounts.findUser(email);
    const purpose = action === "verify" ? "verify" : "reset";
    if (!user || !(await checkOtp(accounts, user, purpose, code)))
      return fail("code");
    // Either code proves the inbox, so a reset also verifies the email.
    await accounts.updateUser(user.id, {
      emailVerified: true,
      ...(action === "reset" && { passwordHash: await hashPassword(password) }),
    });
    return signedIn(user);
  }
  if (action === "resend" || action === "forgot") {
    if (!emailConfigured()) return fail("email_unavailable", 503);
    const user = await accounts.findUser(email);
    const wanted = action === "resend" ? user?.emailVerified === false : !!user;
    // Same reply whether or not the account exists, so emails can't be probed.
    if (user && wanted) {
      const result = await sendCode(
        user,
        action === "resend" ? "verify" : "reset",
        locale,
      );
      if (result === "cooldown") return fail("cooldown", 429);
      if (result === "error") return fail("server", 500);
    }
    return NextResponse.json({ ok: true });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!validPassword(password)) return fail("password");

  if (action === "signup") {
    const name = text(body.name, 80);
    if (name.length < 2) return fail("name");
    // Without a mail service, codes can't be delivered; accounts are verified as before.
    const verify = emailConfigured();
    const passwordHash = await hashPassword(password);
    // New accounts are always customers; staff roles are granted by a super admin.
    let user: UserRecord | null = null;
    const created = await accounts.createUser({
      email,
      name,
      role: "customer",
      passwordHash,
      emailVerified: !verify,
    });
    if (!created) {
      const existing = await accounts.findUser(email);
      // Nobody has proved this inbox yet, so a repeat signup may take it over.
      if (!verify || existing?.emailVerified !== false)
        return fail("exists", 409);
      await accounts.updateUser(existing.id, { name, passwordHash });
      user = { ...existing, name };
    }
    if (!verify) return signedIn(created!);
    user ??= await accounts.findUser(email);
    const result = await sendCode(user!, "verify", locale);
    if (result === "error") return fail("server", 500);
    return NextResponse.json({ verify: true });
  }

  const user = await accounts.findUser(email);
  if (user?.lockedUntil && user.lockedUntil > new Date().toISOString())
    return fail("locked", 429);
  // Same answer for unknown email and wrong password, so emails can't be probed.
  dummyHash ??= hashPassword("timing-equaliser");
  const valid = await verifyPassword(
    password,
    user?.passwordHash || (await dummyHash),
  );
  if (!user || !valid) {
    if (user) {
      const failures = user.failedLogins + 1;
      await accounts.setLoginState(
        user.id,
        failures >= MAX_FAILURES ? 0 : failures,
        failures >= MAX_FAILURES
          ? new Date(Date.now() + LOCK_MS).toISOString()
          : null,
      );
    }
    return fail("credentials", 401);
  }
  if (user.failedLogins || user.lockedUntil)
    await accounts.setLoginState(user.id, 0, null);
  if (user.emailVerified === false) {
    // Right password but unproven inbox: send (or keep) a code and ask for it.
    const result = await sendCode(user, "verify", locale);
    if (result === "error") return fail("server", 500);
    return NextResponse.json({ verify: true }, { status: 403 });
  }
  return signedIn(user);
}
