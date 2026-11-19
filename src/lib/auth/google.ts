import type { NextRequest } from "next/server";
import { routing } from "../../i18n/routing";
import type { AccountRepository, User } from "../data/account";

// Google OpenID Connect, server-side "authorization code" flow.
export const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
export const oauthCookie = "rf_oauth";

export const callbackUrl = (request: NextRequest) =>
  new URL("/api/auth/google/callback", request.nextUrl.origin).toString();

/** Where to land after Google: the visitor's language, account page. */
export function landing(request: NextRequest, failed = false) {
  const saved = request.cookies.get("refolks-lang")?.value;
  const lang = routing.locales.includes(saved as never) ? saved : "en";
  const url = new URL(`/${lang}/account`, request.nextUrl.origin);
  if (failed) url.searchParams.set("auth", "google_failed");
  return url;
}

export type GoogleClaims = {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nonce?: string;
  exp: number;
};

/**
 * Reads the ID token payload. Its signature is not checked: per Google's
 * OpenID Connect guide, a token received directly from the token endpoint over
 * HTTPS is trusted; the claims below are still validated.
 */
export function readIdToken(
  idToken: string,
  clientId: string,
  nonce: string,
  now = Date.now(),
): GoogleClaims | null {
  try {
    const part = idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    // Decode as UTF-8 so Vietnamese names survive.
    const bytes = Uint8Array.from(atob(part), (c) => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as GoogleClaims;
    const issuerOk =
      claims.iss === "https://accounts.google.com" ||
      claims.iss === "accounts.google.com";
    if (!issuerOk || claims.aud !== clientId || claims.nonce !== nonce)
      return null;
    if (claims.exp * 1000 <= now || !claims.sub) return null;
    if (!claims.email || claims.email_verified !== true) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Links Google to the account with that email (any role), or creates a customer. */
export async function googleUser(
  accounts: AccountRepository,
  claims: GoogleClaims,
): Promise<User | null> {
  const email = claims.email!.toLowerCase();
  const existing = await accounts.findUser(email);
  if (existing) {
    // A different Google account now holds this address: don't hand over the account.
    if (existing.googleId && existing.googleId !== claims.sub) return null;
    await accounts.updateUser(existing.id, {
      googleId: claims.sub,
      emailVerified: true,
    });
    return existing;
  }
  return accounts.createUser({
    email,
    name: (claims.name || email.split("@")[0]).slice(0, 80),
    role: "customer",
    passwordHash: "", // no password until the user sets one via "forgot password"
    emailVerified: true,
    googleId: claims.sub,
  });
}
