import { z } from "zod";
import type { Brand } from "../extract.js";
import type { Copy } from "./copy.js";
import type { LLMProvider } from "../providers/llm.js";

const KINDS = ["post", "thread", "reply-bait", "quote"] as const;
export const PostSchema = z.object({
  time: z.string(),
  kind: z.string().transform((k) => { const v = k.toLowerCase().replace(/[_ ]/g, "-"); return (KINDS as readonly string[]).includes(v) ? (v as (typeof KINDS)[number]) : v.includes("thread") ? "thread" : v.includes("reply") ? "reply-bait" : v.includes("quote") ? "quote" : "post"; }),
  text: z.union([z.string(), z.array(z.string())]).transform((t) => (Array.isArray(t) ? t.join("\n\n") : t)),
  media: z.string().nullish().transform((v) => v || undefined).optional(),
});
export const DaySchema = z.object({
  day: z.coerce.number(), label: z.string(), goal: z.string().nullish().transform((v) => v ?? ""),
  posts: z.array(PostSchema).min(1),
  crossPost: z.array(z.string()).nullish().transform((v) => v ?? []),
});
export const PlanSchema = z.object({ days: z.array(DaySchema).min(7).transform((d) => d.slice(0, 7)) });
export type XPlan = z.infer<typeof PlanSchema> & { source: "llm" | "template"; startDate: string; warnings: string[] };

const X_LIMIT = 280;

function addDays(iso: string, n: number) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

export function templatePlan(b: Brand, c: Copy, startDate: string, url: string): XPlan {
  const f = b.features.map((x) => x.title);
  const f1 = f[0] || b.oneLiner, f2 = f[1] || f1, f3 = f[2] || f2;
  const days: XPlan["days"] = [
    { day: 1, label: "Teaser (T-2)", goal: "Warm up followers; collect launch-day supporters", crossPost: ["Indie Hackers: 'Launching in 2 days' post"], posts: [
      { time: "09:00", kind: "post", text: `I've been quietly building ${b.name} — ${b.oneLiner.charAt(0).toLowerCase() + b.oneLiner.slice(1)}\n\nLaunching in 2 days. Want early access? Reply "in" 👇`, media: "social/x-post-1600x900.png" },
      { time: "16:00", kind: "post", text: `The problem that made me build ${b.name}: [TODO: one sentence about the pain you felt].\n\nAnyone else deal with this?` },
    ] },
    { day: 2, label: "Behind the scenes (T-1)", goal: "Build credibility and story", crossPost: [], posts: [
      { time: "10:00", kind: "thread", text: `How I built ${b.name} (thread) 🧵\n\n1/ The idea: ${b.valueProp.split(/[.!?]/)[0]}.\n\n2/ The stack: [TODO: your stack].\n\n3/ The hardest part: [TODO].\n\n4/ Launching tomorrow on Product Hunt. Follow along →`, media: "shots/desktop-hero.png" },
      { time: "18:00", kind: "reply-bait", text: `Launching ${b.name} tomorrow. What's one thing you'd want it to do that it probably doesn't yet?` },
    ] },
    { day: 3, label: "LAUNCH DAY", goal: "Drive traffic + Product Hunt upvotes from real users", crossPost: ["Product Hunt (go live 00:01 PT)", "Indie Hackers: Show IH", "Relevant subreddit (check its self-promo rules first)", "Hacker News: Show HN (only if technical audience)"], posts: [
      { time: "07:00", kind: "post", text: `${b.name} is live 🚀\n\n${c.productHunt.tagline}\n\n${f.slice(0, 3).map((x) => `→ ${x}`).join("\n")}\n\n${url}`, media: "social/og-1200x630.png" },
      { time: "07:05", kind: "post", text: `We're on Product Hunt today — honest feedback is the best support: [TODO: Product Hunt URL]` },
      { time: "12:00", kind: "post", text: `Launch day update: [TODO: a real number — signups, visitors, comments]. Thank you all 🙏\n\nFavourite feedback so far: "[TODO: quote a real reply]"` },
      { time: "20:00", kind: "post", text: `Day 1 of ${b.name} in the wild. What surprised me most: [TODO]. Thanks for every reply and repost.` },
    ] },
    { day: 4, label: "Feature spotlight #1", goal: "Convert visitors who didn't try it yet", crossPost: [], posts: [
      { time: "10:00", kind: "post", text: `One thing ${b.name} does that I'm proud of: ${f1}.\n\n[TODO: 1-2 lines on why it matters]\n\n${url}`, media: "shots/desktop-section-1.png" },
    ] },
    { day: 5, label: "Feature spotlight #2 + social proof", goal: "Show real usage", crossPost: ["Reply in 2-3 relevant community threads where it genuinely helps"], posts: [
      { time: "10:00", kind: "post", text: `${f2} — here's how it works in ${b.name}:`, media: "shots/mobile-hero.png" },
      { time: "15:00", kind: "quote", text: `Quote-post the best piece of user feedback you've received this week with a thank-you.` },
    ] },
    { day: 6, label: "Lessons learned", goal: "Reach the builder audience; earn reposts", crossPost: ["Indie Hackers: launch retrospective post"], posts: [
      { time: "11:00", kind: "thread", text: `What I learned launching ${b.name} this week 🧵\n\n1/ [TODO: what worked]\n\n2/ [TODO: what flopped]\n\n3/ [TODO: real numbers]\n\n4/ What I'm building next: ${f3}` },
    ] },
    { day: 7, label: "Roadmap + ask", goal: "Turn launch attention into an ongoing audience", crossPost: [], posts: [
      { time: "10:00", kind: "reply-bait", text: `${b.name} is one week old. Help me choose what to build next:\n\nA) [TODO]\nB) [TODO]\nC) something else (reply!)` },
      { time: "17:00", kind: "post", text: `If you tried ${b.name} this week — thank you. If you haven't: ${url}\n\nFollow for weekly build updates.` },
    ] },
  ];
  return finalize({ days }, "template", startDate);
}

function finalize(p: z.infer<typeof PlanSchema>, source: "llm" | "template", startDate: string): XPlan {
  const warnings: string[] = [];
  const BANNED = /\b(seamless(ly)?|empower(s|ing)?|revolutioni[sz]e|unleash|game[- ]chang(er|ing)|cutting[- ]edge|supercharge|elevate|leverage|effortless(ly)?|unlock)\b/gi;
  for (const d of p.days) for (const post of d.posts) {
    const hits = post.text.match(BANNED); if (hits) warnings.push(`Day ${d.day} ${post.time}: cliché ${[...new Set(hits)].join(", ")}`);
    if (post.kind !== "thread" && post.text.length > X_LIMIT) warnings.push(`Day ${d.day} ${post.time}: ${post.text.length} chars > ${X_LIMIT} (needs X Premium or trimming)`);
  }
  return { ...p, source, startDate, warnings };
}

/** Flag numbers in posts that do not appear in the source text (likely invented). */
export function flagUnsourcedNumbers(p: XPlan, sourceText: string): XPlan {
  const corpus = sourceText.toLowerCase().replace(/,/g, "").replace(/(\d+) times\b/g, "$1x");
  for (const d of p.days) for (const x of d.posts) {
    for (const n of x.text.replace(/\[TODO:[^\]]*\]/g, "").match(/\$?\d[\d,.]*\s?(%|k\b|p\b|x\b|\+)?/gi) || []) {
      const v = n.replace(/,/g, "").trim().toLowerCase().replace(/^\$/, "").replace(/[.]$/, "");
      if (/^\d{1,2}$/.test(v)) continue;
      if (!corpus.includes(v)) p.warnings.push(`Day ${d.day} ${x.time}: number "${n.trim()}" not found on the site — verify or replace`);
    }
  }
  return p;
}

export async function generatePlan(b: Brand, c: Copy, llm: LLMProvider, startDate: string, url: string): Promise<XPlan> {
  if (!llm.available) return templatePlan(b, c, startDate, url);
  const out = await llm.json({
    system: "You are a launch strategist for indie makers on X (Twitter). Write in the maker's first person, casual and specific. Never invent metrics, timings, resolutions, demo results, or testimonials — every number must appear in the brand JSON; otherwise use a [TODO: ...] placeholder. Never suggest buying upvotes or asking for upvotes directly (Product Hunt forbids it). Single posts must be <=280 characters. Avoid these words: seamless, empower, revolutionize, unleash, game-changer, cutting-edge, supercharge, elevate, leverage, effortless, unlock.",
    prompt: `Brand: ${JSON.stringify(b)}\nCopy: ${JSON.stringify({ headlines: c.headlines, ph: c.productHunt })}\nURL: ${url}\n\nReturn JSON {days:[7 items]}; each day {day (1-7), label, goal, posts:[{time "HH:MM" local, kind: post|thread|reply-bait|quote, text, media? (one of: social/og-1200x630.png, social/x-post-1600x900.png, shots/desktop-hero.png, shots/desktop-section-1.png, shots/mobile-hero.png)}], crossPost:[strings]}. Day 1-2 teaser/build-in-public, Day 3 launch day (Product Hunt), Days 4-7 feature spotlights, lessons, roadmap.`,
    schema: PlanSchema,
    maxTokens: 12000,
  });
  return out ? finalize(out, "llm", startDate) : templatePlan(b, c, startDate, url);
}

export function planToMarkdown(p: XPlan, b: Brand): string {
  return `# ${b.name} — 7-day X launch plan\n_source: ${p.source} · start ${p.startDate}${p.warnings.length ? ` · warnings: ${p.warnings.join("; ")}` : ""}_\n\nReplace every \`[TODO: …]\` with something true. Never buy upvotes or engagement.\n\n` +
    p.days.map((d) => `## Day ${d.day} — ${addDays(p.startDate, d.day - 1)} · ${d.label}\n**Goal:** ${d.goal}\n\n${d.posts.map((x) => `**${x.time} · ${x.kind}**${x.media ? ` · 📎 \`${x.media}\`` : ""}\n\n${x.text.split("\n").map((l) => `> ${l}`).join("\n")}\n`).join("\n")}${d.crossPost.length ? `\n**Also post to:** ${d.crossPost.join("; ")}\n` : ""}`).join("\n");
}

export function planToCsv(p: XPlan): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = ["date,time,kind,text,media"];
  for (const d of p.days) for (const x of d.posts) rows.push([addDays(p.startDate, d.day - 1), x.time, x.kind, esc(x.text), x.media || ""].join(","));
  return rows.join("\n") + "\n";
}
