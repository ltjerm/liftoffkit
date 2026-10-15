import { z } from "zod";
import type { Brand } from "../extract.js";
import type { LLMProvider } from "../providers/llm.js";

export const CopySchema = z.object({
  headlines: z.array(z.string()).min(3).max(6),
  subhead: z.string(),
  cta: z.object({ primary: z.string(), secondary: z.string() }),
  features: z.array(z.object({ title: z.string(), body: z.string() })),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  meta: z.object({ title: z.string(), description: z.string() }),
  productHunt: z.object({ tagline: z.string(), description: z.string(), makerComment: z.string() }),
  appStore: z.object({ subtitle: z.string(), keywords: z.string(), promoText: z.string() }),
});
export type Copy = z.infer<typeof CopySchema> & { source: "llm" | "template"; warnings: string[] };

const BANNED = /\b(seamless(ly)?|empower(s|ing)?|revolutioni[sz]e|unleash|game[- ]chang(er|ing)|cutting[- ]edge|supercharge|elevate|leverage|synergy)\b/gi;
const LIMITS = { "meta.title": 60, "meta.description": 160, "productHunt.tagline": 60, "productHunt.description": 260, "appStore.subtitle": 30, "appStore.keywords": 100, "appStore.promoText": 170 } as const;

/**
 * Trim text to fit within a character limit, ending at a sentence or clause boundary.
 * No trailing ellipsis. Returns the original if already within limit.
 */
export function trimToSentence(s: string, n: number): string {
  if (s.length <= n) return s;
  const truncated = s.slice(0, n);
  // Try to find the last sentence boundary (.!?) followed by space or end
  const sentenceMatch = truncated.match(/^([\s\S]*[.!?])(?:\s|$)/);
  if (sentenceMatch && sentenceMatch[1].length >= n * 0.5) {
    return sentenceMatch[1].trim();
  }
  // Fall back to clause boundaries: semicolon, em-dash, colon, or comma
  // Match content up to and including the punctuation, then strip it for cleaner output
  const clauseMatch = truncated.match(/^([\s\S]*?)([;—:\-,])\s/);
  if (clauseMatch && clauseMatch[1].length >= n * 0.4) {
    return clauseMatch[1].trim();
  }
  // Last resort: break at word boundary, no ellipsis
  return truncated.replace(/\s+\S*$/, "").trim();
}

/** Enforce character limits and flag clichés (the "critic pass", deterministic). */
export function critic(c: Omit<Copy, "source" | "warnings">): { copy: typeof c; warnings: string[] } {
  const warnings: string[] = [];
  const get = (p: string) => p.split(".").reduce<any>((o, k) => o[k], c);
  const set = (p: string, v: string) => { const ks = p.split("."); ks.slice(0, -1).reduce<any>((o, k) => o[k], c)[ks.at(-1)!] = v; };
  for (const [p, n] of Object.entries(LIMITS)) {
    const v = get(p) as string;
    if (v.length > n) {
      warnings.push(`${p} trimmed ${v.length}→${n} chars`);
      if (p === "appStore.keywords") {
        // Keywords: trim at last complete keyword (comma-separated)
        set(p, v.slice(0, n).replace(/,[^,]*$/, ""));
      } else {
        // All other fields: trim to sentence/clause boundary
        set(p, trimToSentence(v, n));
      }
    }
  }
  const all = JSON.stringify(c);
  const hits = [...new Set((all.match(BANNED) || []).map((h) => h.toLowerCase()))];
  if (hits.length) warnings.push(`cliché words present: ${hits.join(", ")}`);
  return { copy: c, warnings };
}

export function templateCopy(b: Brand): Copy {
  const feats = b.features.slice(0, 6);
  const plat = b.platforms.includes("ios") ? "iPhone" : b.platforms.includes("android") ? "Android" : "the web";
  const kw = [...new Set([b.name, ...feats.flatMap((f) => f.title.toLowerCase().split(/\W+/))].filter((w) => w && w.length > 3))].join(",");
  const draft = {
    headlines: [b.oneLiner, `${b.name}: ${b.valueProp.split(/[.!?]/)[0]}`, `Meet ${b.name}.`, feats[0] ? `${feats[0].title}, without the busywork.` : `Do more with ${b.name}.`],
    subhead: b.description,
    cta: { primary: b.pricingModel.includes("free") ? `Try ${b.name} free` : `Get ${b.name}`, secondary: "See how it works" },
    features: feats.map((f) => ({ title: f.title, body: f.detail || "[TODO: one sentence on the benefit — add an LLM key to auto-write this]" })),
    faq: [
      { q: `What is ${b.name}?`, a: b.description },
      { q: "How much does it cost?", a: b.pricingModel === "unknown" ? "[TODO: pricing]" : `${b.name} uses a ${b.pricingModel} model. See the pricing page for details.` },
      { q: `Does ${b.name} work on ${plat}?`, a: `Yes — ${b.name} is available on ${b.platforms.join(", ")}.` },
      { q: "Is my data safe?", a: "See our Privacy Policy for exactly what we collect and why." },
      { q: "How do I get support?", a: b.contactEmail ? `Email ${b.contactEmail}.` : "[TODO: support contact]" },
    ],
    meta: { title: `${b.name} — ${b.oneLiner}`, description: b.description },
    productHunt: {
      tagline: b.oneLiner,
      description: b.description,
      makerComment: `Hey Product Hunt 👋 I built ${b.name} because ${"[TODO: the problem you hit]"}. ${b.name} ${b.valueProp.charAt(0).toLowerCase() + b.valueProp.slice(1)}\n\nWhat's inside:\n${feats.slice(0, 4).map((f) => `• ${f.title}`).join("\n")}\n\nI'd love your honest feedback — what would make this a must-have for you?`,
    },
    appStore: { subtitle: b.oneLiner, keywords: kw, promoText: b.description },
  };
  const { copy, warnings } = critic(draft);
  return { ...copy, source: "template", warnings };
}

export async function generateCopy(b: Brand, llm: LLMProvider): Promise<Copy> {
  if (!llm.available) return templateCopy(b);
  const out = await llm.json({
    system: "You write launch copy for indie software. Be concrete, specific, and plain-spoken. Use only facts in the brand JSON; never invent stats, customers, or testimonials. Avoid these words: seamless, empower, revolutionize, unleash, game-changer, cutting-edge, supercharge, elevate, leverage.",
    prompt: `Brand JSON:\n${JSON.stringify(b)}\n\nReturn JSON with keys: headlines (5 variants, <=70 chars), subhead (<=160), cta{primary,secondary}, features[{title,body}] (one per brand feature, body 1-2 sentences), faq[{q,a}] (6), meta{title<=60,description<=160}, productHunt{tagline<=60, description<=260, makerComment (first-person, 80-150 words, ends with a question)}, appStore{subtitle<=30, keywords comma-separated <=100 chars, promoText<=170}.`,
    schema: CopySchema,
  });
  if (!out) return templateCopy(b);
  // Over-limit fields: one cheap rewrite pass instead of cutting mid-sentence.
  const over = Object.entries(LIMITS).filter(([p, n]) => (p.split(".").reduce<any>((o, k) => o[k], out) as string).length > n);
  if (over.length) {
    const fields = Object.fromEntries(over.map(([p, n]) => [p, { maxChars: n, current: p.split(".").reduce<any>((o, k) => o[k], out) }]));
    const Rewrite = z.record(z.string(), z.string());
    const fixed = await llm.json({
      system: "You shorten marketing copy to hard character limits. Keep meaning and facts; complete sentences or phrases only; no ellipses. For keywords, return a comma-separated list without spaces.",
      prompt: `Rewrite each field to be at most maxChars characters (count carefully, aim 5-10% under). Return JSON {"<field path>": "<new text>"} for exactly these fields:\n${JSON.stringify(fields)}`,
      schema: Rewrite, maxTokens: 2000,
    });
    if (fixed) for (const [p, v] of Object.entries(fixed)) {
      const ks = p.split("."); const parent = ks.slice(0, -1).reduce<any>((o, k) => o?.[k], out);
      if (parent && typeof parent[ks.at(-1)!] === "string") parent[ks.at(-1)!] = v;
    }
  }
  const { copy, warnings } = critic(out);
  return { ...copy, source: "llm", warnings };
}

export function copyToMarkdown(c: Copy, b: Brand): string {
  return `# ${b.name} — Launch copy\n_source: ${c.source}${c.warnings.length ? ` · warnings: ${c.warnings.join("; ")}` : ""}_\n\n## Headline options\n${c.headlines.map((h) => `- ${h}`).join("\n")}\n\n## Subhead\n${c.subhead}\n\n**CTA:** ${c.cta.primary} · ${c.cta.secondary}\n\n## Features\n${c.features.map((f) => `### ${f.title}\n${f.body}`).join("\n\n")}\n\n## FAQ\n${c.faq.map((f) => `**${f.q}**\n${f.a}`).join("\n\n")}\n\n## SEO\n- Title: ${c.meta.title}\n- Description: ${c.meta.description}\n\n## Product Hunt\n- Tagline: ${c.productHunt.tagline}\n- Description: ${c.productHunt.description}\n\n**Maker comment**\n\n${c.productHunt.makerComment}\n\n## App Store\n- Subtitle: ${c.appStore.subtitle}\n- Keywords: ${c.appStore.keywords}\n- Promotional text: ${c.appStore.promoText}\n`;
}
