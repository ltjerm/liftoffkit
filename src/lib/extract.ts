import { z } from "zod";
import type { ScrapeResult } from "./scrape.js";
import type { LLMProvider } from "./providers/llm.js";

export const BrandSchema = z.object({
  name: z.string(),
  oneLiner: z.string(),
  description: z.string(),
  category: z.string(),
  audience: z.string(),
  valueProp: z.string(),
  features: z.array(z.object({ title: z.string(), detail: z.string() })).min(1).max(10),
  tone: z.string(),
  palette: z.object({ primary: z.string(), background: z.string(), text: z.string(), accent: z.string().optional() }),
  fonts: z.array(z.string()),
  platforms: z.array(z.enum(["web", "ios", "android", "mac", "windows", "chrome-extension"])),
  pricingModel: z.string(),
  xHandle: z.string().optional(),
  contactEmail: z.string().optional(),
  services: z.array(z.string()),
  existingLegal: z.object({ privacy: z.string().optional(), terms: z.string().optional() }),
});
export type Brand = z.infer<typeof BrandSchema> & { source: "llm" | "heuristic" };
const PLATFORMS = ["web", "ios", "android", "mac", "windows", "chrome-extension"] as const;
const LLMBrandSchema = BrandSchema.omit({ palette: true, fonts: true, existingLegal: true, platforms: true, services: true }).extend({
  platforms: z.array(z.string()).transform((a) => a.map((x) => x.toLowerCase().replace(/^macos$/, "mac")).filter((x): x is (typeof PLATFORMS)[number] => (PLATFORMS as readonly string[]).includes(x))),
  xHandle: z.string().nullish().transform((v) => v || undefined),
  contactEmail: z.string().nullish().transform((v) => v || undefined),
  features: z.array(z.object({ title: z.string(), detail: z.string().nullish().transform((v) => v ?? "") })).min(1).transform((a) => a.slice(0, 6)),
  name: z.string(), oneLiner: z.string(),
  description: z.string().nullish().transform((v) => v ?? ""),
  category: z.string().nullish().transform((v) => v ?? "unknown"),
  audience: z.string().nullish().transform((v) => v ?? "unknown"),
  valueProp: z.string().nullish().transform((v) => v ?? ""),
  tone: z.union([z.string(), z.array(z.string())]).nullish().transform((v) => (Array.isArray(v) ? v.join(", ") : v ?? "unknown")),
  pricingModel: z.string().nullish().transform((v) => v ?? "unknown"),
});

const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); if (Number.isNaN(n)) return 0.5; const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const sat = (hex: string) => { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
const clean = (s?: string) => (s || "").replace(/\s+/g, " ").trim();

export function heuristicBrand(s: ScrapeResult): Brand {
  const host = new URL(s.finalUrl).hostname.replace(/^www\./, "");
  const titleParts = clean(s.title).split(/\s[|–—\-:·]\s/);
  const name = clean(s.meta["og:site_name"] || s.meta["application-name"]) || (titleParts[0].length <= 30 ? titleParts[0] : "") || host.split(".")[0].replace(/^./, (c) => c.toUpperCase());
  const description = clean(s.meta["description"] || s.meta["og:description"] || s.meta["twitter:description"]);
  const h1 = clean(s.headings.h1[0]);
  const oneLiner = (h1 && h1.length < 120 && h1.toLowerCase() !== name.toLowerCase() && h1.split(" ").length > 2 ? h1 : "") || titleParts.slice(1).join(" — ") || description.split(/(?<=\.)\s/)[0] || name;
  const featureCandidates = [...s.headings.h3, ...s.headings.h2].map(clean).filter((t) => t.length > 3 && t.length < 80 && !/faq|pricing|testimonial|footer|newsletter|subscribe|copyright|©|^follow\b|^(who it's for|compare|features|about|blog|contact|resources|company|product|products|legal|starter|basic|growth|business|pro|plus|team|teams|enterprise|free|premium|elsewhere|other products|support)$/i.test(t) && !/trusted by|loved by|frequently asked|testimonials?|what (people|our customers) say|get started|join \d|customers|free trial|sign up|ready to|it.s time|❤|start (now|today)/i.test(t) && !t.endsWith("?"));
  const uniq = [...new Set(featureCandidates)].slice(0, 6);
  const features = (uniq.length ? uniq : [oneLiner]).map((title) => ({ title, detail: "" }));

  const hexes = s.colors.map((c) => c.color).filter((c) => /^#[0-9a-f]{6}$/i.test(c));
  const background = hexes[0] || "#ffffff";
  const vivid = (h: string) => sat(h) > 0.45 && lum(h) > 0.15 && lum(h) < 0.85;
  const text = hexes.find((h) => Math.abs(lum(h) - lum(background)) > 0.5 && !vivid(h)) || (lum(background) > 0.5 ? "#111111" : "#ffffff");
  const cta = (s.ctaColors || []).filter((h) => /^#[0-9a-f]{6}$/i.test(h));
  const primary = cta.find(vivid) || hexes.find((h) => vivid(h) && h !== background) || cta.find((h) => Math.abs(lum(h) - lum(background)) > 0.3) || (s.meta["theme-color"]?.startsWith("#") ? s.meta["theme-color"] : undefined) || text;
  const accent = hexes.find((h) => vivid(h) && h !== primary);

  const hrefs = s.links.map((l) => l.href).join(" ");
  const platforms: Brand["platforms"] = ["web"];
  if (/apps\.apple\.com|itunes\.apple\.com/.test(hrefs) || s.meta["apple-itunes-app"]) platforms.push("ios");
  if (/play\.google\.com/.test(hrefs)) platforms.push("android");
  if (/chromewebstore\.google\.com|chrome\.google\.com\/webstore/.test(hrefs)) platforms.push("chrome-extension");
  const metaTw = [s.meta["twitter:site"], s.meta["twitter:creator"]].find((h) => h && !/twitterhandle|yourhandle|username|@?handle$/i.test(h));
  const tw = metaTw || s.links.map((l) => l.href.match(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})(?:[/?#]|$)/)?.[1]).find((h) => h && !/^(intent|share|home|i)$/i.test(h));
  const email = s.links.map((l) => l.href.match(/^mailto:([^?]+)/)?.[1]).find(Boolean) || s.text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
  const t = s.text.toLowerCase();
  const pricingModel = /free trial/.test(t) ? "free trial + paid" : /\bfree\b.*\bpro\b|freemium|free plan/.test(t) ? "freemium" : /one[- ]time|lifetime/.test(t) ? "one-time" : /\/mo|per month|monthly/.test(t) ? "subscription" : "unknown";

  return {
    source: "heuristic", name, oneLiner, description: description || oneLiner, category: "unknown", audience: "unknown",
    valueProp: description || oneLiner, features, tone: "unknown",
    palette: { primary, background, text, accent }, fonts: s.fonts, platforms, pricingModel,
    xHandle: tw ? (tw.startsWith("@") ? tw : `@${tw}`) : undefined, contactEmail: email,
    services: s.detectedServices, existingLegal: { privacy: s.legalLinks.privacy, terms: s.legalLinks.terms },
  };
}

export async function extractBrand(s: ScrapeResult, llm: LLMProvider): Promise<Brand> {
  const base = heuristicBrand(s);
  if (!llm.available) return base;
  const out = await llm.json({
    system: "You are a product marketer. Extract facts about a software product from its scraped website. Never invent features, metrics, or customers that are not supported by the text. Use 'unknown' when unsure. Features must be real product capabilities (what the product does for the user) — never navigation/footer/section labels like 'Other Products', 'Resources', 'Compare', 'Pricing', FAQ questions, or plan names. Write each feature title in <=6 words and detail as one factual sentence from the page. category: short noun phrase (e.g. 'privacy-focused web analytics'). audience: who it's for. tone: 2-4 adjectives describing the site's voice. platforms: subset of web, ios, android, mac, windows, chrome-extension supported by evidence.",
    prompt: `Return a JSON object. Do not include palette (it is measured from CSS). Keys: name, oneLiner (<=90 chars), description (1-2 sentences), category, audience, valueProp, features[{title,detail}] (4-6 items), tone, platforms[], pricingModel (e.g. 'freemium', 'subscription from $9/mo', 'unknown'), xHandle (or null), contactEmail (or null).\n\nHeuristic draft (verify/improve):\n${JSON.stringify(base)}\n\nPage title: ${s.title}\nMeta: ${JSON.stringify(s.meta)}\nHeadings: ${JSON.stringify(s.headings)}\nVisible text (truncated):\n${s.text.slice(0, 12000)}`,
    schema: LLMBrandSchema,
  });
  if (!out) return base;
  return { ...base, ...out, platforms: out.platforms.length ? out.platforms : base.platforms, xHandle: out.xHandle ?? base.xHandle, contactEmail: out.contactEmail ?? base.contactEmail, source: "llm" };
}
