import fs from "node:fs";
import path from "node:path";
const BANNED = /\b(seamless(ly)?|empower(s|ing)?|revolutioni[sz]e|unleash|game[- ]chang(er|ing)|cutting[- ]edge|supercharge|elevate|leverage|synergy|effortless(ly)?|unlock|next[- ]level|in today's)\b/gi;
for (const dir of process.argv.slice(2)) {
  const src = JSON.parse(fs.readFileSync(path.join(dir, "scrape.json"), "utf8"));
  const corpus = (src.text + " " + JSON.stringify(src.meta) + " " + src.title).toLowerCase().replace(/,/g, "").replace(/(\d+) times\b/g, "$1x $1 times");
  const copy = JSON.parse(fs.readFileSync(path.join(dir, "copy/copy.json"), "utf8"));
  const plan = JSON.parse(fs.readFileSync(path.join(dir, "launch/x-plan.json"), "utf8"));
  const texts: [string, string][] = [];
  const walk = (o: any, p: string) => { if (typeof o === "string") texts.push([p, o]); else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, `${p}.${k}`); };
  walk({ headlines: copy.headlines, subhead: copy.subhead, features: copy.features, faq: copy.faq, meta: copy.meta, productHunt: copy.productHunt, appStore: copy.appStore }, "copy");
  plan.days.forEach((d: any) => d.posts.forEach((x: any, i: number) => texts.push([`x.d${d.day}.${i}.${x.kind}`, x.text])));
  const issues: string[] = [];
  for (const [p, t] of texts) {
    const clean = t.replace(/\[TODO:[^\]]*\]/g, "");
    for (const n of clean.match(/\$?\d[\d,.]*\s?(%|k\b|\+|x\b|m\b)?/gi) || []) {
      const v = n.replace(/,/g, "").trim().toLowerCase();
      if (/^\d{1,2}(:\d\d)?$/.test(v) || /^\d\/$/.test(v)) continue; // thread numbering, small counts
      if (!corpus.includes(v.replace(/^\$/, ""))) issues.push(`NUMBER-NOT-IN-SOURCE ${p}: "${n.trim()}"`);
    }
    for (const b of clean.match(BANNED) || []) issues.push(`CLICHE ${p}: "${b}"`);
    if (p.startsWith("x.") && !p.endsWith("thread") && t.length > 280) issues.push(`OVER-280 ${p}: ${t.length}`);
    if (/"[^"]{8,}"/.test(clean) && /(said|says|love|told|—\s*\w+)/i.test(clean) && p.startsWith("x.")) issues.push(`POSSIBLE-QUOTE ${p}: ${clean.slice(0, 80)}`);
  }
  const todos = texts.filter(([, t]) => t.includes("[TODO")).length;
  console.log(`\n== ${path.basename(dir)}  texts=${texts.length} todos=${todos} copyWarnings=${copy.warnings.length ? copy.warnings.join("; ") : "none"} planWarnings=${plan.warnings.length}`);
  console.log(issues.length ? issues.join("\n") : "no issues");
}
