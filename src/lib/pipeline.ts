import fs from "node:fs/promises";
import path from "node:path";
import type { Browser } from "playwright-core";
import { scrape } from "./scrape.js";
import { extractBrand } from "./extract.js";
import { generateCopy, copyToMarkdown } from "./generate/copy.js";
import { privacyPolicy, termsOfService, legalTodos, type LegalIntake } from "./generate/legal.js";
import { generatePlan, planToMarkdown, planToCsv, flagUnsourcedNumbers } from "./generate/xplan.js";
import { getLLM, usage, estimateCostUSD } from "./providers/llm.js";
import { getImageProvider } from "./providers/image.js";
import { generateVisuals } from "./generate/visuals.js";
import { launchBrowser } from "./scrape.js";

export interface KitOptions { aiLogo?: boolean; aiBackground?: boolean; outDir: string; startDate?: string; intake?: LegalIntake; browser?: Browser; scrapeOnly?: boolean }

export async function runKit(url: string, o: KitOptions) {
  const t0 = Date.now();
  const llm = getLLM(), img = getImageProvider();
  const steps: Record<string, { status: "ok" | "stub" | "skipped" | "error"; ms: number; note?: string }> = {};
  const step = async <T>(name: string, fn: () => Promise<T>, status: "ok" | "stub" = "ok", note?: string): Promise<T> => {
    const s = Date.now();
    try { const r = await fn(); steps[name] = { status, ms: Date.now() - s, note }; return r; }
    catch (e) { steps[name] = { status: "error", ms: Date.now() - s, note: (e as Error).message }; throw e; }
  };
  await fs.mkdir(o.outDir, { recursive: true });
  const w = (p: string, d: string) => fs.mkdir(path.dirname(path.join(o.outDir, p)), { recursive: true }).then(() => fs.writeFile(path.join(o.outDir, p), d));
  const stubNote = () => (llm.available ? undefined : llm.lastError ? `LLM unavailable (${llm.lastError}) — heuristic/template output` : "OPENAI_API_KEY not set — heuristic/template output");
  const llmStep = async <T extends { source: string }>(name: string, fn: () => Promise<T>) => {
    const r = await step(name, fn);
    if (r.source !== "llm") steps[name] = { ...steps[name], status: "stub", note: stubNote() };
    return r;
  };

  try {
    const s = await step("scrape", () => scrape(url, o.outDir, { browser: o.browser }));
    if (o.scrapeOnly) return finish();
    const brand = await llmStep("extract", () => extractBrand(s, llm));
    await w("brand.json", JSON.stringify(brand, null, 2));
    const copy = await llmStep("copy", () => generateCopy(brand, llm));
    await w("copy/copy.json", JSON.stringify(copy, null, 2));
    await w("copy/copy.md", copyToMarkdown(copy, brand));
    await step("legal", async () => {
      const pp = privacyPolicy(brand, o.intake, s.finalUrl), tos = termsOfService(brand, o.intake, s.finalUrl);
      await w("legal/privacy.md", pp); await w("legal/terms.md", tos);
      await w("legal/TODO.md", `# Fill these before publishing\n\n## privacy.md\n${legalTodos(pp).map((t) => `- ${t}`).join("\n") || "- none"}\n\n## terms.md\n${legalTodos(tos).map((t) => `- ${t}`).join("\n") || "- none"}\n`);
    });
    const start = o.startDate || new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
    const plan = flagUnsourcedNumbers(await llmStep("xplan", () => generatePlan(brand, copy, llm, start, s.finalUrl)), s.text + " " + JSON.stringify(brand));
    await w("launch/x-plan.json", JSON.stringify(plan, null, 2));
    await w("launch/x-plan.md", planToMarkdown(plan, brand));
    await w("launch/x-plan.csv", planToCsv(plan));
    const browser = o.browser ?? (await launchBrowser());
    try {
      const v = await step("visuals", () => generateVisuals({ outDir: o.outDir, brand, copy, scrape: s, browser, image: img, aiLogo: o.aiLogo, useAiBackground: o.aiBackground }));
      steps.visuals.note = `${v.files.filter((f) => f.endsWith(".png")).length} PNGs; AI images: ${v.aiImages} (~$${v.estUSD.toFixed(3)})${v.notes.length ? "; " + v.notes.join("; ") : ""}`;
      if ((o.aiLogo || o.aiBackground) && v.aiImages === 0) steps.visuals.status = "stub";
    } finally { if (!o.browser) await browser.close(); }
  } finally { await finish(); }
  return finish();

  async function finish() {
    const manifest = { url, outDir: o.outDir, providers: { llm: llm.name, image: img.name }, steps, totalMs: Date.now() - t0, llmUsageCumulative: { ...usage, estUSD: Number(estimateCostUSD().toFixed(4)) } };
    await fs.writeFile(path.join(o.outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    return manifest;
  }
}
