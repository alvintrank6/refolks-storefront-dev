import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_TOKEN,
  callbackUrl,
  googleUser,
  landing,
  oauthCookie,
  readIdToken,
} from "../../../../../src/lib/auth/google";
import { startSession } from "../../../../../src/lib/auth/session";
import { accountRepository } from "../../../../../src/lib/data";

/** Google returns here with ?code&state; exchange it, link or create the account, sign in. */
export async function GET(request: NextRequest) {
  const failed = () => {
    const response = NextResponse.redirect(landing(request, true));
    response.cookies.set(oauthCookie, "", {
      path: "/api/auth/google",
      maxAge: 0,
    });
    return response;
  };
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const params = request.nextUrl.searchParams;
  const [state, nonce] = (request.cookies.get(oauthCookie)?.value ?? "").split(
    ".",
  );
  const code = params.get("code");
  if (
    !clientId ||
    !clientSecret ||
    !code ||
    !state ||
    params.get("state") !== state
  )
    return failed();

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl(request),
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!tokenResponse.ok) return failed();
    const { id_token } = (await tokenResponse.json()) as { id_token?: string };
    const claims = id_token && readIdToken(id_token, clientId, nonce);
    if (!claims) return failed();
    const user = await googleUser(await accountRepository(), claims);
    if (!user) return failed();
    const response = NextResponse.redirect(landing(request));
    response.cookies.set(oauthCookie, "", {
      path: "/api/auth/google",
      maxAge: 0,
    });
    await startSession(response, user.id);
    return response;
  } catch (error) {
    console.error("Google sign-in failed", String(error));
    return failed();
  }
}
