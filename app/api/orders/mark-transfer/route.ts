import { NextRequest, NextResponse } from "next/server";
import { isLocale, paths } from "../../../../src/lib/catalog";
import { markTransfer } from "../../../../src/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const rawLocale = String(form.get("locale") ?? "en");
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const token = String(form.get("token") ?? "");
  if (/^[0-9a-f]{64}$/.test(token)) await markTransfer(token);
  return NextResponse.redirect(new URL(`${paths(locale).order}/${token}`, request.url), 303);
}
