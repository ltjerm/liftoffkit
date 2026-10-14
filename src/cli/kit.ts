import path from "node:path";
import { runKit } from "../lib/pipeline.js";

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--"));
const flag = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=");
if (!url) {
  console.error("Usage: npm run kit -- <url> [--out=dir] [--start=YYYY-MM-DD] [--company=\"Acme LLC\"] [--email=you@x.com] [--law=\"the State of Colorado, USA\"] [--scrape-only] [--ai-logo] [--ai-bg]");
  process.exit(1);
}
const slug = url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
const outDir = path.resolve(flag("out") || path.join("out", slug));
const m = await runKit(url, {
  outDir, startDate: flag("start"), aiLogo: args.includes("--ai-logo"), aiBackground: args.includes("--ai-bg"), scrapeOnly: args.includes("--scrape-only"),
  intake: { companyName: flag("company"), contactEmail: flag("email"), jurisdiction: flag("law") },
}).catch((e) => { console.error(`✗ ${e.message}`); return process.exit(2); });
for (const [k, v] of Object.entries(m.steps)) console.log(`${v.status === "ok" ? "✓" : v.status === "stub" ? "~" : v.status === "skipped" ? "-" : "✗"} ${k.padEnd(24)} ${String(v.ms).padStart(6)}ms ${v.note ?? ""}`);
console.log(`\nproviders: llm=${m.providers.llm} image=${m.providers.image}\noutput: ${outDir}`);
