import { NextRequest, NextResponse } from "next/server";
import { randomToken } from "../../../../src/lib/auth/crypto";
import {
  GOOGLE_AUTH,
  callbackUrl,
  landing,
  oauthCookie,
} from "../../../../src/lib/auth/google";

/** Starts Google sign-in: anti-forgery state + nonce in a short-lived cookie. */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(landing(request, true));
  const state = randomToken();
  const nonce = randomToken();
  const url = new URL(GOOGLE_AUTH);
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: callbackUrl(request),
    state,
    nonce,
    prompt: "select_account",
  }).toString();
  const response = NextResponse.redirect(url);
  // Lax, because Google returns with a top-level GET from another site.
  response.cookies.set(oauthCookie, `${state}.${nonce}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return response;
}
