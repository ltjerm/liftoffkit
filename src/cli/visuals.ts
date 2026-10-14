// Re-scrape (free) and regenerate M3 visuals from an existing kit folder without re-spending on the LLM.
import fs from "node:fs/promises";
import path from "node:path";
import { scrape, launchBrowser } from "../lib/scrape.js";
import { generateVisuals } from "../lib/generate/visuals.js";
import { getImageProvider } from "../lib/providers/image.js";
const args = process.argv.slice(2);
const dirs = args.filter((a) => !a.startsWith("--"));
const browser = await launchBrowser();
const img = getImageProvider();
for (const dir of dirs) {
  const brand = JSON.parse(await fs.readFile(path.join(dir, "brand.json"), "utf8"));
  const copy = JSON.parse(await fs.readFile(path.join(dir, "copy/copy.json"), "utf8"));
  const prev = JSON.parse(await fs.readFile(path.join(dir, "scrape.json"), "utf8"));
  const s = args.includes("--no-rescrape") ? prev : await scrape(prev.finalUrl, dir, { browser });
  const t0 = Date.now();
  const v = await generateVisuals({ outDir: dir, brand, copy, scrape: s, browser, image: img, aiLogo: args.includes("--ai-logo"), useAiBackground: args.includes("--ai-bg") });
  console.log(`${path.basename(dir)}: ${v.files.filter((f) => f.endsWith(".png")).length} PNGs in ${Date.now() - t0}ms; AI images ${v.aiImages} (~$${v.estUSD.toFixed(3)}) ${v.notes.join(" | ")}`);
}
await browser.close();
