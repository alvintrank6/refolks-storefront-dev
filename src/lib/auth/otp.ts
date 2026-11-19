import type { AccountRepository, Otp, UserRecord } from "../data/account";
import { sendTransactionalEmail } from "../email";
import { sha256 } from "./crypto";

const TTL_MS = 10 * 60_000;
const RESEND_MS = 60_000;
const MAX_ATTEMPTS = 5;

// Salting with the user id stops one table of 10^6 hashes covering every user.
const hashCode = (code: string, userId: string) => sha256(`${userId}:${code}`);

const copy = {
  verify: {
    vi: ["Mã xác minh Refolks", "Mã xác minh email của bạn là"],
    en: ["Your Refolks verification code", "Your email verification code is"],
  },
  reset: {
    vi: ["Mã đặt lại mật khẩu Refolks", "Mã đặt lại mật khẩu của bạn là"],
    en: ["Your Refolks password reset code", "Your password reset code is"],
  },
} as const;

/** Emails a fresh 6-digit code, replacing any earlier one. */
export async function issueOtp(
  accounts: AccountRepository,
  user: UserRecord,
  purpose: Otp["purpose"],
  locale: "vi" | "en",
  now = Date.now(),
): Promise<"sent" | "cooldown"> {
  if (user.otp && now - Date.parse(user.otp.sentAt) < RESEND_MS)
    return "cooldown";
  // 2^32 mod 10^6 skews the spread by < 0.03%, irrelevant for a 5-try code.
  const code = String(
    crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000,
  ).padStart(6, "0");
  await accounts.updateUser(user.id, {
    otp: {
      purpose,
      codeHash: await hashCode(code, user.id),
      expiresAt: new Date(now + TTL_MS).toISOString(),
      attempts: 0,
      sentAt: new Date(now).toISOString(),
    },
  });
  const [subject, intro] = copy[purpose][locale];
  const sent = await sendTransactionalEmail({
    to: user.email,
    subject,
    text:
      locale === "vi"
        ? `${intro}: ${code}\nMã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`
        : `${intro}: ${code}\nIt expires in 10 minutes. If you did not ask for it, ignore this email.`,
    idempotencyKey: `otp-${user.id}-${now}`,
  });
  if (!sent) throw new Error("EMAIL_UNAVAILABLE");
  return "sent";
}

/** True once, for the right unexpired code; wrong guesses burn attempts. */
export async function checkOtp(
  accounts: AccountRepository,
  user: UserRecord,
  purpose: Otp["purpose"],
  code: string,
  now = Date.now(),
) {
  const otp = user.otp;
  if (!otp || otp.purpose !== purpose || Date.parse(otp.expiresAt) <= now)
    return false;
  if (
    !/^\d{6}$/.test(code) ||
    otp.codeHash !== (await hashCode(code, user.id))
  ) {
    const attempts = otp.attempts + 1;
    // shortcut: read-then-write, so parallel guesses can exceed 5 by a few; use an atomic $inc if this is ever attacked.
    await accounts.updateUser(user.id, {
      otp: attempts >= MAX_ATTEMPTS ? null : { ...otp, attempts },
    });
    return false;
  }
  await accounts.updateUser(user.id, { otp: null });
  return true;
}
