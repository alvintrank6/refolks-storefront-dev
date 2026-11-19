import { NextRequest, NextResponse } from "next/server";
import { accountRepository } from "../data";
import type { User } from "../data/account";
import { randomToken, sha256 } from "./crypto";
import { can, type Permission } from "./roles";

export const sessionCookie = "rf_session";
const SESSION_DAYS = 30;

/**
 * Parses a JSON body. Requiring the JSON content type is the CSRF guard:
 * a cross-site form cannot send it without a CORS preflight we never allow.
 */
export async function jsonBody(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    return null;
  const body = (await request.json().catch(() => null)) as unknown;
  return body && typeof body === "object"
    ? (body as Record<string, unknown>)
    : null;
}

export async function startSession(response: NextResponse, userId: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await (
    await accountRepository()
  ).createSession(await sha256(token), userId, expires.toISOString());
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession(request: NextRequest, response: NextResponse) {
  const token = request.cookies.get(sessionCookie)?.value;
  if (token)
    await (await accountRepository()).deleteSession(await sha256(token));
  response.cookies.set(sessionCookie, "", { path: "/", maxAge: 0 });
}

export async function currentUser(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get(sessionCookie)?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  return (await accountRepository()).sessionUser(await sha256(token));
}

/** The signed-in user if allowed, otherwise the 401/403 response to return. */
export async function authorize(
  request: NextRequest,
  permission?: Permission,
): Promise<User | NextResponse> {
  const user = await currentUser(request);
  if (!user)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (permission && !can(user.role, permission))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return user;
}
