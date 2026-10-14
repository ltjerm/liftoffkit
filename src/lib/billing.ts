import Stripe from "stripe";

export type Tier = "liftoff" | "liftoff-plus";
export const TIERS: Record<Tier, { name: string; amount: number; priceEnv: string }> = {
  liftoff: { name: "LiftoffKit", amount: 2900, priceEnv: "STRIPE_PRICE_LIFTOFF" },
  "liftoff-plus": { name: "LiftoffKit+", amount: 7900, priceEnv: "STRIPE_PRICE_LIFTOFF_PLUS" },
};
export const isTier = (t: unknown): t is Tier => t === "liftoff" || t === "liftoff-plus";

let client: Stripe | null = null;
/** Server-only. Reads STRIPE_SECRET_KEY from env; returns null when not configured. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return (client ??= new Stripe(key));
}
export const stripeMode = () => (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") || process.env.STRIPE_SECRET_KEY?.startsWith("rk_live_") ? "live" : "test");

/** Price for a tier: env price id if set, else inline price_data (works in test mode with no setup). */
export function lineItem(tier: Tier): Stripe.Checkout.SessionCreateParams.LineItem {
  const t = TIERS[tier];
  const price = process.env[t.priceEnv];
  if (price) return { price, quantity: 1 };
  return { quantity: 1, price_data: { currency: "usd", unit_amount: t.amount, product_data: { name: t.name } } };
}

/** Job state lives on the PaymentIntent metadata — Stripe doubles as the job queue (no DB needed). */
export type KitStatus = "queued" | "running" | "delivered" | "failed";
