import { NextRequest, NextResponse } from "next/server";
import { currentUser, jsonBody } from "../../../src/lib/auth/session";
import { storeRepository } from "../../../src/lib/data";
import { sendTransactionalEmail } from "../../../src/lib/email";
import { roundTwoLines } from "../../../src/refolks/order";

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** JSON checkout for the round-two storefront (RefolksExperience). */
export async function POST(request: NextRequest) {
  const body = await jsonBody(request);
  if (!body) return NextResponse.json({ error: "details" }, { status: 400 });
  const locale = body.locale === "vi" ? "vi" : "en";
  const name = text(body.name, 80);
  const email = text(body.email, 150);
  const phone = text(body.phone, 20).replace(/[\s.-]/g, "");
  const address = text(body.address, 200);
  const city = body.region === "hanoi" ? "hanoi" : "other";
  const fail = (error: string, status = 400) =>
    NextResponse.json({ error }, { status });

  if (text(body.website, 1)) return fail("details");
  if (name.length < 2) return fail("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("email");
  if (!/^\+?\d{9,12}$/.test(phone)) return fail("phone");
  if (address.length < 5) return fail("address");
  const lines = roundTwoLines(body.items, locale);
  if (!lines) return fail("items");

  try {
    const created = await (
      await storeRepository()
    ).placeOrder({
      lines,
      locale,
      name,
      phone,
      email,
      address,
      city,
      delivery: "ship",
      // shortcut: round-two checkout has no payment picker yet, so orders are COD until a gateway is chosen.
      payment: "cod",
      userId: (await currentUser(request))?.id ?? null,
    });
    const total = `${created.total.toLocaleString("vi-VN")} ₫`;
    const list = lines
      .map((l) => `- ${l.name} (${l.colour}) × ${l.qty}`)
      .join("\n");
    const tasks = [
      sendTransactionalEmail({
        to: email,
        subject:
          locale === "vi"
            ? `Refolks đã nhận đơn ${created.number}`
            : `Refolks order ${created.number} received`,
        text:
          locale === "vi"
            ? `Đơn ${created.number} đã được ghi nhận, thanh toán khi nhận hàng.\n${list}\nTổng cộng: ${total}`
            : `Order ${created.number} has been recorded, payable on delivery.\n${list}\nTotal: ${total}`,
        idempotencyKey: `order-${created.number}-customer`,
      }),
    ];
    if (process.env.ORDER_NOTIFY_EMAIL)
      tasks.push(
        sendTransactionalEmail({
          to: process.env.ORDER_NOTIFY_EMAIL,
          subject: `New Refolks order ${created.number}`,
          text: `Order ${created.number}\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n${list}\nTotal: ${total}`,
          idempotencyKey: `order-${created.number}-admin`,
        }),
      );
    // The order is already saved; a mail failure must not fail checkout.
    for (const result of await Promise.allSettled(tasks))
      if (result.status === "rejected")
        console.error("Order email failed", String(result.reason));
    return NextResponse.json({ number: created.number, total: created.total });
  } catch (error) {
    if (String(error).includes("OUT_OF_STOCK")) return fail("stock", 409);
    console.error("Checkout failed", String(error));
    return fail("server", 500);
  }
}
