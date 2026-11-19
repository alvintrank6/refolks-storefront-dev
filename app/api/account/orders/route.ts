import { NextRequest, NextResponse } from "next/server";
import { authorize } from "../../../../src/lib/auth/session";
import { accountRepository } from "../../../../src/lib/data";

/** The signed-in customer's own orders. */
export async function GET(request: NextRequest) {
  const user = await authorize(request);
  if (user instanceof NextResponse) return user;
  const orders = await (await accountRepository()).listOrders(user.id);
  return NextResponse.json({ orders });
}
