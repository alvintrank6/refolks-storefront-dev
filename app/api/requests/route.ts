import { NextRequest, NextResponse } from "next/server";
import { jsonBody } from "../../../src/lib/auth/session";
import { storeRepository } from "../../../src/lib/data";
import { sendTransactionalEmail } from "../../../src/lib/email";
import { requestIpHash } from "../../../src/lib/ip-hash";

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** JSON intake for the round-two Care and newsletter forms (stored as messages). */
export async function POST(request: NextRequest) {
  const body = await jsonBody(request);
  const fail = (error: string, status = 400) =>
    NextResponse.json({ error }, { status });
  if (!body || text(body.website, 1)) return fail("details");
  const locale = body.locale === "vi" ? "vi" : "en";
  const email = text(body.email, 150);
  if (!isEmail(email)) return fail("email");

  let draft;
  if (body.kind === "care") {
    const name = text(body.name, 80);
    const phone = text(body.phone, 20).replace(/[\s.-]/g, "");
    const note = text(body.note, 2000);
    if (name.length < 2) return fail("name");
    if (!/^\+?\d{9,12}$/.test(phone)) return fail("phone");
    if (note.length < 5) return fail("note");
    draft = {
      name,
      contact: `${email} / ${phone}`,
      topic: "care",
      body: note,
    };
  } else if (body.kind === "newsletter") {
    // shortcut: subscribers live in the messages table; move to a Resend audience once consent/unsubscribe flow is specified.
    draft = {
      name: email,
      contact: email,
      topic: "newsletter",
      body: "Newsletter signup",
    };
  } else return fail("kind");

  try {
    await (
      await storeRepository()
    ).createMessage({
      ...draft,
      orderNumber: null,
      locale,
      ipHash: await requestIpHash(request),
    });
  } catch (error) {
    if (String(error).includes("RATE_LIMITED")) return fail("rate-limit", 429);
    console.error("Request intake failed", String(error));
    return fail("server", 500);
  }
  if (draft.topic === "care" && process.env.ORDER_NOTIFY_EMAIL)
    await sendTransactionalEmail({
      to: process.env.ORDER_NOTIFY_EMAIL,
      subject: "Refolks Care request",
      text: `Name: ${draft.name}\nContact: ${draft.contact}\nNote: ${draft.body}`,
      idempotencyKey: `care-${crypto.randomUUID()}`,
    }).catch((error) =>
      console.error("Care notification failed", String(error)),
    );
  return NextResponse.json({ ok: true });
}
