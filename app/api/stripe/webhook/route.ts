import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "../../../../src/lib/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(raw, sig ?? "", secret); }
  catch { return NextResponse.json({ error: "bad signature" }, { status: 400 }); }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status === "paid" && typeof s.payment_intent === "string") {
      const pi = await stripe.paymentIntents.retrieve(s.payment_intent);
      // Idempotent: only move forward from pending_payment.
      if (!pi.metadata.kit_status || pi.metadata.kit_status === "pending_payment") {
        await stripe.paymentIntents.update(pi.id, { metadata: { kit_status: "queued", checkout_session: s.id, queued_at: String(event.created) } });
      }
      const hook = process.env.KIT_WORKER_WEBHOOK_URL; // optional: nudge the worker instead of waiting for its poll
      if (hook) await fetch(hook, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.KIT_WORKER_TOKEN ?? ""}` }, body: JSON.stringify({ session: s.id }) }).catch(() => {});
    }
  }
  return NextResponse.json({ received: true });
}
