/**
 * Kit job worker. Stripe is the queue: paid Checkout Sessions whose PaymentIntent has
 * metadata.kit_status=queued (set by /api/stripe/webhook) get a kit generated, zipped and emailed.
 *
 *   npm run worker            # dry run: list queued jobs, do nothing
 *   npm run worker -- --run   # generate kits, write ZIPs to out/_orders/, mark delivered-pending-email
 *   npm run worker -- --run --send   # also email via Resend (needs verified sending domain)
 *   add --loop to poll every 60s.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { zipSync } from "fflate";
import { sendKitEmail } from "../lib/delivery.js";
import { getStripe } from "../lib/billing.js";
import { runKit } from "../lib/pipeline.js";

const args = process.argv.slice(2);
const RUN = args.includes("--run"), SEND = args.includes("--send"), LOOP = args.includes("--loop");
const stripe = getStripe();
if (!stripe) { console.error("STRIPE_SECRET_KEY not set"); process.exit(1); }

async function zipDir(dir: string): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const walk = async (d: string) => {
    for (const e of await fs.readdir(d, { withFileTypes: true })) {
      const p = path.join(d, e.name), rel = path.relative(dir, p);
      if (rel.startsWith("scrape") || rel.startsWith("shots")) continue; // internal artifacts
      if (e.isDirectory()) await walk(p); else files[rel] = new Uint8Array(await fs.readFile(p));
    }
  };
  await walk(dir);
  return zipSync(files, { level: 6 });
}

async function queued() {
  const out = [];
  for await (const s of stripe!.checkout.sessions.list({ status: "complete", limit: 100, created: { gte: Math.floor(Date.now() / 1000) - 30 * 86400 }, expand: ["data.payment_intent"] })) {
    const pi = s.payment_intent;
    if (s.payment_status === "paid" && pi && typeof pi !== "string" && pi.metadata.kit_status === "queued") out.push({ s, pi });
  }
  return out;
}

async function once() {
  const jobs = await queued();
  console.log(`${jobs.length} queued job(s)`);
  for (const { s, pi } of jobs) {
    const appUrl = s.metadata?.app_url!, tier = s.metadata?.tier, email = s.customer_details?.email;
    console.log(`- ${s.id} tier=${tier} url=${appUrl} email=${email ? "yes" : "missing"}`);
    if (!RUN) continue;
    await stripe!.paymentIntents.update(pi.id, { metadata: { kit_status: "running" } });
    try {
      const outDir = path.resolve("out/_orders", s.id);
      await runKit(appUrl, { outDir, intake: { contactEmail: undefined } });
      const zip = await zipDir(outDir);
      const zipPath = `${outDir}.zip`;
      await fs.writeFile(zipPath, zip);
      console.log(`  zip ${zipPath} (${(zip.length / 1e6).toFixed(1)} MB)`);
      if (SEND && email && process.env.RESEND_API_KEY) {
        const id = await sendKitEmail(email, appUrl, tier, zip);
        console.log(`  emailed, resend id ${id}`);
        await stripe!.paymentIntents.update(pi.id, { metadata: { kit_status: "delivered" } });
      } else {
        await stripe!.paymentIntents.update(pi.id, { metadata: { kit_status: "generated" } });
        console.log("  not emailed (no --send / RESEND_API_KEY / email) — status=generated");
      }
    } catch (e) {
      console.error(`  ✗ ${(e as Error).message}`);
      await stripe!.paymentIntents.update(pi.id, { metadata: { kit_status: "failed", kit_error: (e as Error).message.slice(0, 450) } });
    }
  }
}

do { await once(); if (LOOP) await new Promise((r) => setTimeout(r, 60_000)); } while (LOOP);
