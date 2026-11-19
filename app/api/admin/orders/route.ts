import { NextRequest, NextResponse } from "next/server";
import { isOrderStatus } from "../../../../src/lib/auth/roles";
import { authorize, jsonBody } from "../../../../src/lib/auth/session";
import { accountRepository } from "../../../../src/lib/data";

export async function GET(request: NextRequest) {
  const user = await authorize(request, "orders:read");
  if (user instanceof NextResponse) return user;
  return NextResponse.json({
    orders: await (await accountRepository()).listOrders(),
  });
}

export async function PATCH(request: NextRequest) {
  const user = await authorize(request, "orders:write");
  if (user instanceof NextResponse) return user;
  const body = await jsonBody(request);
  if (!body || typeof body.number !== "string" || !isOrderStatus(body.status))
    return NextResponse.json({ error: "details" }, { status: 400 });
  const result = await (
    await accountRepository()
  ).setOrderStatus(body.number, body.status);
  if (result === "not_found")
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (result === "final")
    return NextResponse.json({ error: "final" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
