import { chromium, type Browser, type Page } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import { assertSafeUrl, isPublicHost } from "./ssrf.js";

export interface ScrapeResult {
  inputUrl: string;
  finalUrl: string;
  fetchedAt: string;
  title: string;
  meta: Record<string, string>;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  text: string;               // visible text, trimmed
  links: { text: string; href: string }[];
  legalLinks: { privacy?: string; terms?: string; pricing?: string };
  favicon?: string;
  ogImage?: string;
  colors: { color: string; count: number }[];
  ctaColors: string[];
  fonts: string[];
  scripts: string[];          // external script hosts
  detectedServices: string[];
  screenshots: string[];      // relative paths
  blockedRequests: string[];
}

const SERVICES: [RegExp, string][] = [
  [/googletagmanager|google-analytics|gtag/, "Google Analytics"],
  [/js\.stripe\.com|stripe/, "Stripe"],
  [/supabase/, "Supabase"],
  [/posthog/, "PostHog"],
  [/plausible/, "Plausible"],
  [/segment\.(com|io)|cdn\.segment/, "Segment"],
  [/mixpanel/, "Mixpanel"],
  [/hotjar/, "Hotjar"],
  [/intercom/, "Intercom"],
  [/crisp\.chat/, "Crisp"],
  [/clerk/, "Clerk"],
  [/firebase|gstatic\.com\/firebasejs/, "Firebase"],
  [/sentry/, "Sentry"],
  [/paddle/, "Paddle"],
  [/lemonsqueezy/, "Lemon Squeezy"],
  [/facebook\.net|fbevents/, "Meta Pixel"],
  [/clarity\.ms/, "Microsoft Clarity"],
  [/vercel-insights|_vercel\/insights|vercel-scripts/, "Vercel Analytics"],
  [/cloudflareinsights/, "Cloudflare Web Analytics"],
  [/hubspot/, "HubSpot"],
  [/youtube\.com|ytimg/, "YouTube embeds"],
  [/fonts\.googleapis|fonts\.gstatic/, "Google Fonts"],
];

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-webrtc", "--force-webrtc-ip-handling-policy=disable_non_proxied_udp"],
  });
}

/** Every request (document, XHR, subresource, redirect hop) is checked against the SSRF guard. */
async function guardPage(page: Page, blocked: string[]) {
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    try {
      const u = new URL(url);
      if (u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      if (!["http:", "https:"].includes(u.protocol) || !(await isPublicHost(u.hostname))) {
        blocked.push(url); return route.abort("blockedbyclient");
      }
      return route.continue();
    } catch { blocked.push(url); return route.abort("blockedbyclient"); }
  });
}

export async function scrape(rawUrl: string, outDir: string, opts: { browser?: Browser; timeoutMs?: number } = {}): Promise<ScrapeResult> {
  const start = await assertSafeUrl(rawUrl);
  const timeout = opts.timeoutMs ?? 30_000;
  const shotsDir = path.join(outDir, "shots");
  await fs.mkdir(shotsDir, { recursive: true });
  const browser = opts.browser ?? (await launchBrowser());
  const blocked: string[] = [];
  const scriptHosts = new Set<string>();
  const screenshots: string[] = [];
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 LiftoffKitBot/0.1",
      acceptDownloads: false, serviceWorkers: "block",
    });
    // tsx/esbuild injects __name() helpers into functions passed to page.evaluate; provide a no-op in the page.
    await ctx.addInitScript("globalThis.__name = globalThis.__name || ((f) => f);");
    const page = await ctx.newPage();
    await guardPage(page, blocked);
    page.on("request", (r) => { if (r.resourceType() === "script") try { scriptHosts.add(new URL(r.url()).host + new URL(r.url()).pathname.slice(0, 40)); } catch {} });
    await page.goto(start.toString(), { waitUntil: "domcontentloaded", timeout });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    // Final URL after redirects must still be public (route guard already enforced each hop).
    await assertSafeUrl(page.url());

    // Dismiss obvious cookie banners so screenshots are clean (best-effort).
    for (const label of ["Accept", "Accept all", "I agree", "Got it", "OK"]) {
      const btn = page.getByRole("button", { name: label, exact: true }).first();
      if (await btn.isVisible({ timeout: 300 }).catch(() => false)) { await btn.click({ timeout: 1000 }).catch(() => {}); break; }
    }

    const data = await page.evaluate(() => {
      const q = (s: string) => Array.from(document.querySelectorAll(s));
      const meta: Record<string, string> = {};
      q("meta").forEach((m) => {
        const k = m.getAttribute("property") || m.getAttribute("name");
        const v = m.getAttribute("content");
        if (k && v && /^(og:|twitter:|description|keywords|theme-color|application-name|apple-itunes-app)/.test(k)) meta[k] = v.slice(0, 500);
      });
      const chrome = (e: Element) => !!e.closest("footer, nav, header, aside, [role=contentinfo], [role=navigation], [class*=footer i], [id*=footer i], [class*=navbar i], [class*=menu i]");
      const txt = (els: Element[]) => els.filter((e) => !chrome(e)).map((e) => (e as HTMLElement).innerText?.trim()).filter(Boolean).slice(0, 20) as string[];
      // CTA colors: backgrounds of visible buttons / button-like links in the main content (best signal for brand primary).
      const cta: Record<string, number> = {};
      q("button, a[class*=btn i], a[class*=button i], [role=button], a[class*=cta i], input[type=submit]").forEach((el) => {
        const r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 20) return;
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)") cta[bg] = (cta[bg] || 0) + 1 + (r.top < 900 ? 2 : 0);
      });
      const links = q("a[href]").map((a) => ({ text: ((a as HTMLElement).innerText || "").trim().slice(0, 80), href: (a as HTMLAnchorElement).href })).filter((l) => l.href.startsWith("http")).slice(0, 200);
      const iconEl = document.querySelector("link[rel~='icon'], link[rel='apple-touch-icon']") as HTMLLinkElement | null;
      // Color sampling from computed styles of visible elements.
      const counts: Record<string, number> = {};
      const fonts: Record<string, number> = {};
      const els = q("body, body *").slice(0, 2500) as HTMLElement[];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        const area = Math.min(r.width * r.height, 200000);
        for (const [c, w] of [[cs.backgroundColor, area], [cs.color, 50], [cs.borderTopColor, 5]] as [string, number][]) {
          if (!c || c === "rgba(0, 0, 0, 0)" || c === "transparent") continue;
          counts[c] = (counts[c] || 0) + w;
        }
        const f = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
        if (f) fonts[f] = (fonts[f] || 0) + 1;
      }
      return {
        title: document.title,
        meta,
        headings: { h1: txt(q("h1")), h2: txt(q("h2")), h3: txt(q("h3")) },
        text: (document.body?.innerText || "").replace(/\n{3,}/g, "\n\n").slice(0, 20000),
        links,
        favicon: iconEl?.href,
        colors: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([color, count]) => ({ color, count: Math.round(count) })),
        ctaColors: Object.entries(cta).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c),
        fonts: Object.entries(fonts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f]) => f),
      };
    });

    // Screenshots: hero + scroll sections (desktop), then mobile.
    const hero = "shots/desktop-hero.png";
    await page.screenshot({ path: path.join(outDir, hero), timeout: 15000 }); screenshots.push(hero);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let i = 1; i <= 3 && i * 900 < height; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * 900);
      await page.waitForTimeout(400);
      const p = `shots/desktop-section-${i}.png`;
      await page.screenshot({ path: path.join(outDir, p), timeout: 15000 }); screenshots.push(p);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    const full = "shots/desktop-full.png";
    await page.screenshot({ path: path.join(outDir, full), fullPage: true, timeout: 20000 }).then(() => screenshots.push(full)).catch(() => {});

    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: "block", acceptDownloads: false });
    await mctx.addInitScript("globalThis.__name = globalThis.__name || ((f) => f);");
    const mpage = await mctx.newPage();
    await guardPage(mpage, blocked);
    await mpage.goto(page.url(), { waitUntil: "domcontentloaded", timeout }).catch(() => {});
    await mpage.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
    const mob = "shots/mobile-hero.png";
    await mpage.screenshot({ path: path.join(outDir, mob), timeout: 15000 }).then(() => screenshots.push(mob)).catch(() => {});
    const mh = await mpage.evaluate(() => document.documentElement.scrollHeight).catch(() => 0);
    for (let i = 1; i <= 2 && i * 844 < mh; i++) {
      await mpage.evaluate((y) => window.scrollTo(0, y), i * 844).catch(() => {});
      await mpage.waitForTimeout(400);
      const p = `shots/mobile-section-${i}.png`;
      await mpage.screenshot({ path: path.join(outDir, p), timeout: 15000 }).then(() => screenshots.push(p)).catch(() => {});
    }
    await mctx.close();

    const finalUrl = page.url();
    await ctx.close();

    const find = (re: RegExp) => data.links.find((l) => re.test(l.text) || re.test(l.href))?.href;
    const scripts = [...scriptHosts];
    // Detect from loaded scripts only (links like "/vs-google-analytics" caused false positives).
    const haystack = scripts.join(" ").toLowerCase();
    const detectedServices = SERVICES.filter(([re]) => re.test(haystack)).map(([, n]) => n);

    const result: ScrapeResult = {
      inputUrl: rawUrl, finalUrl, fetchedAt: new Date().toISOString(),
      title: data.title, meta: data.meta, headings: data.headings, text: data.text, links: data.links,
      legalLinks: { privacy: find(/privacy/i), terms: find(/terms|tos\b|conditions/i), pricing: find(/pricing|plans/i) },
      favicon: data.favicon, ogImage: data.meta["og:image"] || data.meta["twitter:image"],
      colors: data.colors.map((c) => ({ ...c, color: rgbToHex(c.color) })), ctaColors: data.ctaColors.map(rgbToHex), fonts: data.fonts,
      scripts, detectedServices, screenshots, blockedRequests: blocked,
    };
    await fs.writeFile(path.join(outDir, "scrape.json"), JSON.stringify(result, null, 2));
    return result;
  } finally {
    if (!opts.browser) await browser.close();
  }
}

export function rgbToHex(c: string): string {
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return c;
  return "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
}
