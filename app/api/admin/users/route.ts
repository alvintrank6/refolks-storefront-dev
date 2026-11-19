import { NextRequest, NextResponse } from "next/server";
import { isRole } from "../../../../src/lib/auth/roles";
import { authorize, jsonBody } from "../../../../src/lib/auth/session";
import { accountRepository } from "../../../../src/lib/data";

export async function GET(request: NextRequest) {
  const user = await authorize(request, "users:manage");
  if (user instanceof NextResponse) return user;
  return NextResponse.json({
    users: await (await accountRepository()).listUsers(),
  });
}

export async function PATCH(request: NextRequest) {
  const user = await authorize(request, "users:manage");
  if (user instanceof NextResponse) return user;
  const body = await jsonBody(request);
  if (!body || typeof body.id !== "string" || !isRole(body.role))
    return NextResponse.json({ error: "details" }, { status: 400 });
  // Stops the last super admin from locking everyone out by demoting themself.
  if (body.id === user.id)
    return NextResponse.json({ error: "self" }, { status: 409 });
  const ok = await (await accountRepository()).setRole(body.id, body.role);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "not_found" }, { status: 404 });
}
