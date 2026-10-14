import path from "node:path";
import { assertSafeUrl, clearHostCache } from "../lib/ssrf.js";
import { launchBrowser } from "../lib/scrape.js";
import { runKit } from "../lib/pipeline.js";

// 1) SSRF guard (strict mode, no dev fake-IP allowance): these must all be rejected.
const devFlag = process.env.LKIT_DEV_FAKEIP_EGRESS;
delete process.env.LKIT_DEV_FAKEIP_EGRESS;
const bad = ["http://127.0.0.1", "http://localhost:3000", "http://10.0.0.5", "http://169.254.169.254/latest/meta-data/", "http://[::1]/", "http://0x7f000001/", "http://2130706433/", "file:///etc/passwd", "http://user:pw@example.com", "http://192.168.1.1", "http://localtest.me", "http://example.com:8080", "gopher://example.com"];
let ok = true;
for (const u of bad) {
  try { await assertSafeUrl(u); console.log(`✗ ALLOWED (bad): ${u}`); ok = false; }
  catch (e) { console.log(`✓ blocked ${u.padEnd(45)} ${(e as Error).message}`); }
}
process.env.LKIT_DEV_FAKEIP_EGRESS = devFlag; clearHostCache();
await assertSafeUrl("https://example.com").then(() => console.log("✓ allowed https://example.com"));
if (!ok) process.exit(1);

// 2) Real sites.
const sites = process.argv.slice(2).length ? process.argv.slice(2) : ["https://plausible.io", "https://tally.so", "https://carrd.co", "https://pika.style", "https://shots.so"];
const browser = await launchBrowser();
const rows: string[] = [];
for (const s of sites) {
  if (rows.length) await new Promise((r) => setTimeout(r, 5000)); // stay under low-tier TPM limits
  const slug = s.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-$/, "");
  const m = await runKit(s, { outDir: path.resolve("out", slug), browser, startDate: "2026-10-20" }).catch((e) => ({ steps: { scrape: { status: "error", ms: 0, note: e.message } } } as any));
  const sc = m.steps.scrape;
  rows.push(`${s.padEnd(24)} scrape=${sc.status} ${sc.ms}ms ${sc.note ?? ""} steps=${Object.entries(m.steps).map(([k, v]: any) => `${k.split(" ")[0]}:${v.status}`).join(",")}`);
}
await browser.close();
console.log("\n" + rows.join("\n"));
