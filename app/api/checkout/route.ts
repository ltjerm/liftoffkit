import { NextResponse } from "next/server";
import { getStripe, isTier, lineItem } from "../../../src/lib/billing";
import { assertSafeUrl } from "../../../src/lib/ssrf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Checkout is not configured yet." }, { status: 503 });
  let body: { url?: unknown; tier?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!isTier(body.tier)) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  if (typeof body.url !== "string" || body.url.length > 500) return NextResponse.json({ error: "Enter a valid URL" }, { status: 400 });
  let appUrl: string;
  try { appUrl = (await assertSafeUrl(body.url.trim())).toString(); }
  catch { return NextResponse.json({ error: "That URL isn't reachable as a public website." }, { status: 400 }); }

  const origin = process.env.PUBLIC_BASE_URL || new URL(req.url).origin;
  const meta = { app_url: appUrl, tier: body.tier };
  let session;
  try {
  session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [lineItem(body.tier)],
    metadata: meta,
    payment_intent_data: { metadata: { ...meta, kit_status: "pending_payment" } },
    customer_creation: "always",
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
  });
  } catch (e) {
    console.error("checkout error", (e as Error).message);
    return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 502 });
  }
  return NextResponse.json({ url: session.url });
}
