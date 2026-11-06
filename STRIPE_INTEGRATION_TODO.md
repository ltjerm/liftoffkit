# Stripe Checkout Studio integration

Checkout Studio settings applied to the existing Checkout Session call in
[`app/api/checkout/route.ts`](app/api/checkout/route.ts) (`stripe.checkout.sessions.create`).
Only the session parameters changed; the page flow, pricing and fulfillment are untouched.

## Values to Replace

None. The integration already uses real values:

- `line_items` come from [`src/lib/billing.ts`](src/lib/billing.ts) (`lineItem()`): `STRIPE_PRICE_LIFTOFF` / `STRIPE_PRICE_LIFTOFF_PLUS` when set, otherwise inline $29 / $79 `price_data`.
- `success_url` / `cancel_url` are built from `PUBLIC_BASE_URL` (or the request origin).
- The API key is `STRIPE_SECRET_KEY` (environment variable, never committed).

## Configured Parameters

| Parameter | Value | Where |
|---|---|---|
| `ui_mode` | `"hosted_page"` (stripe-node 23.0.0 ≥ 21.0.0) | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `billing_address_collection` | `"auto"` | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `phone_number_collection` | `{ enabled: false }` | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `automatic_tax` | `{ enabled: false }` | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `allow_promotion_codes` | `false` | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `submit_type` | `"auto"` | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `integration_identifier` | `"hosted_web_0002"` | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `origin_context` | `"web"` | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `mode` | `"payment"` (unchanged) | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `line_items` | `lineItem(tier)` (unchanged) | [`src/lib/billing.ts`](src/lib/billing.ts) |
| `success_url` | `${origin}/success?session_id={CHECKOUT_SESSION_ID}` (unchanged) | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |
| `cancel_url` | `${origin}/#pricing` (unchanged) | [`app/api/checkout/route.ts`](app/api/checkout/route.ts) |

`payment_method_collection` is intentionally not set (it only applies to `subscription`/`setup` mode).

### Kept because fulfillment depends on them

| Parameter | Why it stays |
|---|---|
| `metadata` (`app_url`, `tier`) | Read by [`app/success/page.tsx`](app/success/page.tsx) and the worker [`src/cli/worker.ts`](src/cli/worker.ts) to know which site to build and which tier was bought. |
| `payment_intent_data.metadata` (`app_url`, `tier`, `kit_status`) | The PaymentIntent metadata is the job queue: [`app/api/stripe/webhook/route.ts`](app/api/stripe/webhook/route.ts) sets `kit_status=queued`, and the worker picks up and updates jobs from it. |
| `customer_creation: "always"` | Creates a Stripe Customer for every purchase, so the buyer's email is kept with the order for delivery and support. |

No `client_reference_id` or `customer_email` was in use, so none was added.

## Verification

- `npx tsc --noEmit` and `npm run build` pass; all parameters are in stripe-node 23.0.0's `SessionCreateParams` types.
- A test-mode session was created with these exact parameters on API version `2026-09-30.endive` (the SDK default). The API accepted all of them and returned them on the session, then the session was expired.

## Next steps

1. Review the preview deployment's checkout (it uses the live key in production only; previews have no Stripe env, so checkout returns 503 there).
2. After merge, run one live checkout to the Stripe page without paying, confirm the page looks as configured in Checkout Studio, then expire the session.
3. If tax collection is wanted later, enable Stripe Tax and switch `automatic_tax.enabled` to `true`.
