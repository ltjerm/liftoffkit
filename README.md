# LiftoffKit — M1–M2 (scrape, extract, copy, legal, 7-day X plan)

```bash
npm install
npm run kit -- <url> [--out=dir] [--start=YYYY-MM-DD] [--company="Acme LLC"] [--email=you@x.com] [--law="the State of Colorado, USA"] [--scrape-only]
npm run test:scrape            # SSRF guard tests + 5 real sites -> out/<site>/
npm run typecheck
```

On the LiftoffKit build box, prefix commands with `LKIT_DEV_FAKEIP_EGRESS=1`. This box's DNS maps every public host into 198.18.0.0/15, a range the guard blocks. Never set the flag in production.

## Output folder
`scrape.json` · `shots/*.png` (desktop hero, 3 sections, full page, mobile @2x) · `brand.json` · `copy/copy.{json,md}` · `legal/{privacy,terms,TODO}.md` · `launch/x-plan.{md,csv,json}` · `manifest.json` (per-step status: ok / stub / skipped / error)

## Providers (env vars; see .env.example)
- `OPENAI_API_KEY` (+ `OPENAI_MODEL`, default `gpt-5-mini`; `OPENAI_BASE_URL` for any OpenAI-compatible endpoint, e.g. Vercel AI Gateway). Without it: heuristic extraction and template copy and X plan, marked `stub`.
- `FAL_KEY`: image generation for M3. Without it, image steps are `skipped`.
- Interfaces: `src/lib/providers/{llm,image}.ts`. LLM output is validated with zod and falls back to the template on failure.

## SSRF guard (src/lib/ssrf.ts)
- Allows only http/https on ports 80 and 443, with no URL credentials. Every DNS answer must be public: blocks loopback, RFC1918, link-local/metadata, CGNAT, ULA, mapped IPv6, and decimal/hex IP forms.
- Playwright routes **every** request (redirect hops and subresources) through the same check. Service workers, downloads and WebRTC are disabled.
- Residual risks: DNS rebinding between our lookup and Chrome's own lookup, and WebSocket upgrades (not intercepted by `page.route`). For production, run the scraper in a Vercel Sandbox behind an egress proxy that enforces the allowlist at the connection level.

## M4 — Checkout & delivery

Flow: URL form → `POST /api/checkout` (SSRF-checked URL, tier) → Stripe hosted Checkout (`mode=payment`, `metadata.app_url`) → `/success`.
`POST /api/stripe/webhook` verifies the signature and, on `checkout.session.completed` (paid), sets the PaymentIntent
`metadata.kit_status=queued`. Stripe is the job queue — no database.

`npm run worker` (dry run) / `-- --run` / `-- --run --send` / `--loop` picks up queued jobs, runs the pipeline (Chrome), zips, emails via Resend, and sets `kit_status` to `generated` / `delivered` / `failed`.
The worker must run somewhere with Chrome + long runtimes (the box, a small VPS, Fly/Railway) — not a Vercel function.

Env (server only, never NEXT_PUBLIC_):
- `STRIPE_SECRET_KEY` (sk_test_… first; or a restricted key with Checkout Sessions write, PaymentIntents write)
- `STRIPE_WEBHOOK_SECRET` (whsec_… from the webhook endpoint)
- optional `STRIPE_PRICE_LIFTOFF`, `STRIPE_PRICE_LIFTOFF_PLUS` (otherwise inline price_data $29/$79)
- optional `PUBLIC_BASE_URL` (e.g. https://liftoffkit.app)
- worker: `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `FAL_KEY`, optional `KIT_FROM_EMAIL`
