import fs from "node:fs/promises";
import path from "node:path";
import type { Browser, BrowserContext } from "playwright-core";
import type { Brand } from "../extract.js";
import type { Copy } from "./copy.js";
import type { ScrapeResult } from "../scrape.js";
import type { ImageProvider } from "../providers/image.js";

/* ---------- color helpers ---------- */
const rgb = (hex: string) => { const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lum = (hex: string) => { const [r, g, b] = rgb(hex).map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const onColor = (hex: string) => (lum(hex) > 0.4 ? "#0b0b0f" : "#ffffff");
const shade = (hex: string, amt: number) => "#" + rgb(hex).map((c) => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))))).map((c) => c.toString(16).padStart(2, "0")).join("");
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const FONT = `-apple-system, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

/** Choose a brand primary that is usable as a large background (not near-white/black on monochrome sites). */
function theme(b: Brand) {
  let p = /^#[0-9a-f]{6}$/i.test(b.palette.primary) ? b.palette.primary : "#4f46e5";
  const l = lum(p);
  const mono = l > 0.85 || l < 0.02;
  if (mono) p = l > 0.85 ? "#111114" : "#111114";
  const accent = b.palette.accent && /^#[0-9a-f]{6}$/i.test(b.palette.accent) ? b.palette.accent : shade(p, 0.35);
  return { primary: p, deep: shade(p, -0.45), light: shade(p, 0.85), accent, on: onColor(p), mono };
}

/* ---------- renderer (isolated: JS off, network blocked, only data: URIs) ---------- */
export class Renderer {
  private ctx?: BrowserContext;
  constructor(private browser: Browser) {}
  async init() {
    this.ctx = await this.browser.newContext({ javaScriptEnabled: false, deviceScaleFactor: 1 });
    await this.ctx.route("**/*", (r) => (r.request().url().startsWith("data:") ? r.continue() : r.abort()));
  }
  async png(html: string, w: number, h: number, out: string, transparent = false) {
    const page = await this.ctx!.newPage();
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:${w}px;height:${h}px;overflow:hidden;font-family:${FONT};${transparent ? "background:transparent" : ""}}</style></head><body>${html}</body></html>`, { waitUntil: "load" });
    await fs.mkdir(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
  }
  async close() { await this.ctx?.close(); }
}

const dataUri = async (file: string) => `data:image/${file.endsWith(".svg") ? "svg+xml" : "png"};base64,${(await fs.readFile(file)).toString("base64")}`;

/* ---------- logo ---------- */
function initials(name: string) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return (words.length > 1 && words[1].length > 2 && !/^(app|analytics|forms?|io|ai|hq)$/i.test(words[1]) ? words[0][0] + words[1][0] : words[0]?.[0] || "?").toUpperCase();
}
function shortName(name: string) { return name.replace(/\s+(analytics|forms?|app|hq|inc\.?|llc)$/i, "").trim() || name; }

export function monogramSvg(b: Brand, size = 512) {
  const t = theme(b);
  const txt = initials(shortName(b.name));
  const fs_ = txt.length > 1 ? size * 0.42 : size * 0.56;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.primary}"/><stop offset="1" stop-color="${t.deep}"/></linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#g)"/>
  <text x="50%" y="50%" dy="0.36em" text-anchor="middle" font-family='${FONT.replace(/"/g, "")}' font-weight="800" font-size="${fs_}" letter-spacing="${-size * 0.01}" fill="${t.on}">${esc(txt)}</text>
</svg>`;
}

/* ---------- ICO packer (PNG-in-ICO, supported by all modern browsers) ---------- */
export function packIco(pngs: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const dirs = pngs.map(({ size, data }) => {
    const d = Buffer.alloc(16);
    d.writeUInt8(size >= 256 ? 0 : size, 0); d.writeUInt8(size >= 256 ? 0 : size, 1); d.writeUInt8(0, 2); d.writeUInt8(0, 3);
    d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6); d.writeUInt32LE(data.length, 8); d.writeUInt32LE(offset, 12);
    offset += data.length; return d;
  });
  return Buffer.concat([header, ...dirs, ...pngs.map((p) => p.data)]);
}

/* ---------- templates ---------- */
const browserFrame = (img: string, w: number, radius = 14) => `
  <div style="width:${w}px;border-radius:${radius}px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.08);background:#fff">
    <div style="height:${Math.round(w * 0.035)}px;background:#f1f1f4;display:flex;align-items:center;gap:${Math.round(w * 0.008)}px;padding-left:${Math.round(w * 0.015)}px">
      ${["#ff5f57", "#febc2e", "#28c840"].map((c) => `<span style="width:${Math.round(w * 0.011)}px;height:${Math.round(w * 0.011)}px;border-radius:50%;background:${c};display:inline-block"></span>`).join("")}
    </div>
    <img src="${img}" style="display:block;width:100%;height:auto"/>
  </div>`;

const phoneFrame = (img: string, w: number) => {
  const h = Math.round(w * 2.165), bezel = Math.round(w * 0.045), r = Math.round(w * 0.16);
  return `<div style="width:${w}px;height:${h}px;border-radius:${r}px;background:#0b0b0f;padding:${bezel}px;box-shadow:0 40px 100px rgba(0,0,0,.45), inset 0 0 0 ${Math.round(w * 0.008)}px #2a2a30">
    <div style="position:relative;width:100%;height:100%;border-radius:${r - bezel}px;overflow:hidden;background:#fff">
      <div style="height:${Math.round(w * 0.13)}px;background:#fff"></div><img src="${img}" style="display:block;width:100%;height:calc(100% - ${Math.round(w * 0.13)}px);object-fit:cover;object-position:top"/>
      <div style="position:absolute;top:${Math.round(w * 0.03)}px;left:50%;transform:translateX(-50%);width:${Math.round(w * 0.3)}px;height:${Math.round(w * 0.085)}px;border-radius:999px;background:#0b0b0f"></div>
    </div></div>`;
};

function bg(t: ReturnType<typeof theme>, aiBg?: string) {
  // AI backgrounds are tinted with the brand gradient so a dark/off-brand generation still reads as on-brand.
  if (aiBg) return `background: linear-gradient(135deg, ${t.primary}b3, ${t.deep}b3), url(${aiBg}) center/cover, ${t.primary};`;
  return `background: radial-gradient(1200px 700px at 85% -10%, ${shade(t.primary, 0.25)} 0%, transparent 60%), radial-gradient(900px 600px at -10% 110%, ${t.accent}55 0%, transparent 60%), linear-gradient(135deg, ${t.primary}, ${t.deep});`;
}

function socialCard(o: { w: number; h: number; t: ReturnType<typeof theme>; logo: string; name: string; headline: string; sub?: string; shot?: string; aiBg?: string; layout?: "split" | "center" }) {
  const { w, h, t } = o;
  const pad = Math.round(h * 0.1);
  const hSize = Math.round(Math.min(w, h * 1.9) * (o.headline.length > 60 ? 0.04 : o.headline.length > 40 ? 0.048 : 0.056));
  const scrim = o.aiBg ? `background:linear-gradient(90deg, ${t.deep}ee 0%, ${t.deep}aa 45%, transparent 100%);` : "";
  if (o.layout === "center" || !o.shot) {
    return `<div style="width:${w}px;height:${h}px;${bg(t, o.aiBg)};color:${t.on};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:${pad}px;gap:${Math.round(h * 0.05)}px">
      <div style="display:flex;align-items:center;gap:${Math.round(h * 0.03)}px"><img src="${o.logo}" style="width:${Math.round(h * 0.14)}px;height:${Math.round(h * 0.14)}px;border-radius:22%;box-shadow:0 8px 30px rgba(0,0,0,.25)"/><span style="font-size:${Math.round(h * 0.07)}px;font-weight:800;letter-spacing:-.02em">${esc(o.name)}</span></div>
      <div style="font-size:${Math.round(hSize * 1.15)}px;font-weight:800;line-height:1.08;letter-spacing:-.03em;max-width:${Math.round(w * 0.8)}px">${esc(o.headline)}</div>
      ${o.sub ? `<div style="font-size:${Math.round(hSize * 0.45)}px;opacity:.85;max-width:${Math.round(w * 0.7)}px;line-height:1.35">${esc(o.sub)}</div>` : ""}
    </div>`;
  }
  const shotW = Math.round(w * 0.56);
  return `<div style="position:relative;width:${w}px;height:${h}px;${bg(t, o.aiBg)};color:${t.on};overflow:hidden">
    <div style="position:absolute;inset:0;${scrim}"></div>
    <div style="position:absolute;left:${pad}px;top:${pad}px;bottom:${pad}px;width:${Math.round(w * 0.42)}px;display:flex;flex-direction:column;justify-content:center;gap:${Math.round(h * 0.045)}px">
      <div style="display:flex;align-items:center;gap:${Math.round(h * 0.025)}px"><img src="${o.logo}" style="width:${Math.round(h * 0.1)}px;height:${Math.round(h * 0.1)}px;border-radius:22%"/><span style="font-size:${Math.round(h * 0.055)}px;font-weight:800;letter-spacing:-.02em">${esc(o.name)}</span></div>
      <div style="font-size:${hSize}px;font-weight:800;line-height:1.08;letter-spacing:-.03em">${esc(o.headline)}</div>
      ${o.sub ? `<div style="font-size:${Math.round(hSize * 0.42)}px;opacity:.85;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(o.sub)}</div>` : ""}
    </div>
    <div style="position:absolute;left:${Math.round(w * 0.5)}px;top:${Math.round(h * 0.16)}px;transform:rotate(-2deg)">${browserFrame(o.shot, shotW)}</div>
  </div>`;
}

function storeShot(o: { w: number; h: number; t: ReturnType<typeof theme>; caption: string; shot: string; aiBg?: string }) {
  const phoneW = Math.round(o.w * 0.74);
  const cap = Math.round(o.w * (o.caption.length > 40 ? 0.068 : 0.08));
  return `<div style="width:${o.w}px;height:${o.h}px;${bg(o.t, o.aiBg)};color:${o.t.on};display:flex;flex-direction:column;align-items:center;padding-top:${Math.round(o.h * 0.06)}px;gap:${Math.round(o.h * 0.04)}px;overflow:hidden">
    <div style="font-size:${cap}px;font-weight:800;line-height:1.1;letter-spacing:-.03em;text-align:center;padding:0 ${Math.round(o.w * 0.08)}px">${esc(o.caption)}</div>
    ${phoneFrame(o.shot, phoneW)}
  </div>`;
}

/* ---------- main ---------- */
export interface VisualsResult { files: string[]; notes: string[]; aiImages: number; estUSD: number }

export async function generateVisuals(o: { outDir: string; brand: Brand; copy: Copy; scrape: ScrapeResult; browser: Browser; image: ImageProvider; useAiBackground?: boolean; aiLogo?: boolean }): Promise<VisualsResult> {
  const { outDir, brand: b, copy: c, scrape: s } = o;
  const t = theme(b);
  const files: string[] = []; const notes: string[] = []; let aiImages = 0, estUSD = 0;
  const P = (rel: string) => { files.push(rel); return path.join(outDir, rel); };
  const r = new Renderer(o.browser); await r.init();
  const name = shortName(b.name);
  try {
    /* Logo (code monogram always; AI candidates when fal is available) */
    const svg = monogramSvg(b);
    await fs.mkdir(path.join(outDir, "logo"), { recursive: true });
    await fs.writeFile(P("logo/logo-mark.svg"), svg);
    const markUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    await r.png(`<img src="${markUri}" style="width:1024px;height:1024px"/>`, 1024, 1024, P("logo/logo-mark-1024.png"), true);
    const wordmark = (dark: boolean) => `<div style="height:240px;display:flex;align-items:center;gap:36px;padding:0 40px"><img src="${markUri}" style="width:180px;height:180px"/><span style="font-size:130px;font-weight:800;letter-spacing:-.035em;color:${dark ? "#ffffff" : "#0b0b0f"}">${esc(name)}</span></div>`;
    const wmW = Math.round(300 + name.length * 78);
    await r.png(wordmark(false), wmW, 240, P("logo/logo-wordmark-light.png"), true);
    await r.png(wordmark(true), wmW, 240, P("logo/logo-wordmark-dark.png"), true);

    let logoUri = markUri;
    if (o.aiLogo && o.image.available) {
      for (let i = 0; i < 3; i++) {
        const res = await o.image.generate({
          model: "fal-ai/recraft/v3/text-to-image", style: "vector_illustration", size: "square_hd",
          colors: [t.primary, t.accent].filter(Boolean),
          prompt: `A minimal, modern app icon logo mark for "${name}", ${b.category !== "unknown" ? b.category : b.oneLiner}. Simple geometric symbol, flat vector, centered, solid background, no text, no letters, high contrast, works at 16px.`,
        });
        if (!res) { notes.push(`AI logo ${i + 1}: fal unavailable${(o.image as { lastError?: string }).lastError ? ` (${(o.image as { lastError?: string }).lastError})` : ""}`); break; }
        aiImages++; estUSD += 0.08;
        const buf = Buffer.from(await (await fetch(res.url)).arrayBuffer());
        const ext = /\.svg($|\?)/.test(res.url) || buf.subarray(0, 5).toString().includes("<svg") || buf.subarray(0, 100).toString().includes("<?xml") ? "svg" : "png";
        await fs.writeFile(P(`logo/ai-candidate-${i + 1}.${ext}`), buf);
        if (ext === "svg") await r.png(`<img src="data:image/svg+xml;base64,${buf.toString("base64")}" style="width:1024px;height:1024px"/>`, 1024, 1024, P(`logo/ai-candidate-${i + 1}-1024.png`));
      }
    } else if (o.aiLogo) notes.push("AI logo skipped: image provider unavailable — using code monogram");

    /* Favicon set from the mark */
    const sizes = [16, 32, 48, 180, 192, 512];
    const icoParts: { size: number; data: Buffer }[] = [];
    for (const sz of sizes) {
      const rel = sz === 180 ? "favicon/apple-touch-icon.png" : `favicon/favicon-${sz}.png`;
      await r.png(`<img src="${markUri}" style="width:${sz}px;height:${sz}px;display:block"/>`, sz, sz, P(rel), sz !== 180);
      if (sz <= 48) icoParts.push({ size: sz, data: await fs.readFile(path.join(outDir, rel)) });
    }
    await fs.writeFile(P("favicon/favicon.ico"), packIco(icoParts));
    await fs.writeFile(P("favicon/favicon.svg"), svg);
    await fs.writeFile(P("favicon/site.webmanifest"), JSON.stringify({ name: b.name, short_name: name, icons: [{ src: "/favicon-192.png", sizes: "192x192", type: "image/png" }, { src: "/favicon-512.png", sizes: "512x512", type: "image/png" }], theme_color: t.primary, background_color: "#ffffff", display: "standalone" }, null, 2));
    await fs.writeFile(P("favicon/HEAD-SNIPPET.html"), `<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">\n<meta name="theme-color" content="${t.primary}">\n<meta property="og:image" content="/og-1200x630.png">\n<meta name="twitter:card" content="summary_large_image">\n`);

    /* Optional AI background (one image reused across cards) */
    let aiBg: string | undefined;
    const cached = path.join(outDir, "social/_ai-background.jpg");
    if (o.useAiBackground && (await fs.stat(cached).catch(() => null))) {
      aiBg = `data:image/jpeg;base64,${(await fs.readFile(cached)).toString("base64")}`; notes.push("AI background reused from cache");
    } else if (o.useAiBackground && o.image.available) {
      const res = await o.image.generate({ model: "fal-ai/flux/schnell", size: "landscape_16_9", prompt: `Abstract soft gradient background, smooth flowing shapes, colors ${t.primary} and ${t.accent}, minimal, no text, no objects, high quality` });
      if (res) { aiImages++; estUSD += 0.003 * 2; const buf = Buffer.from(await (await fetch(res.url)).arrayBuffer()); await fs.writeFile(P("social/_ai-background.jpg"), buf); aiBg = `data:image/jpeg;base64,${buf.toString("base64")}`; }
      else notes.push("AI background skipped: fal unavailable — using code gradient");
    }

    /* Social / OG */
    const shot = (n: string) => (s.screenshots.includes(n) ? path.join(outDir, n) : undefined);
    const hero = shot("shots/desktop-hero.png");
    const heroUri = hero ? await dataUri(hero) : undefined;
    const hl = [...c.headlines, b.oneLiner].filter(Boolean);
    const headline = hl.find((x) => x.length <= 48) || [...hl].sort((x, y) => x.length - y.length)[0] || name;
    const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter((w) => w.length > 3);
    const overlap = (a: string, z: string) => { const A = new Set(norm(a)); const Z = norm(z); return Z.length ? Z.filter((w) => A.has(w)).length / Z.length : 0; };
    const subCands = [c.subhead, b.description, b.valueProp, b.oneLiner].filter((x) => x && x.length <= 140);
    const sub = subCands.find((x) => overlap(headline, x) < 0.5) || "";
    const cards: [string, number, number, "split" | "center"][] = [
      ["social/og-1200x630.png", 1200, 630, "split"], ["social/x-post-1600x900.png", 1600, 900, "split"], ["social/linkedin-1200x627.png", 1200, 627, "split"],
      ["social/github-social-1280x640.png", 1280, 640, "split"], ["social/x-header-1500x500.png", 1500, 500, "center"],
    ];
    for (const [rel, w, h, layout] of cards) await r.png(socialCard({ w, h, t, logo: markUri, name, headline, sub: layout === "center" || !sub ? undefined : sub, shot: heroUri, aiBg, layout }), w, h, P(rel));
    await r.png(`<img src="${markUri}" style="width:240px;height:240px;display:block"/>`, 240, 240, P("producthunt/thumbnail-240.png"));

    /* Product Hunt gallery: browser-framed desktop shots with captions */
    const desk = ["shots/desktop-hero.png", "shots/desktop-section-1.png", "shots/desktop-section-2.png", "shots/desktop-section-3.png"].filter((n) => s.screenshots.includes(n));
    const capsPH = [headline, ...c.features.map((f) => f.title)];
    for (let i = 0; i < Math.min(4, desk.length); i++) {
      const img = await dataUri(path.join(outDir, desk[i]));
      await r.png(`<div style="width:1270px;height:760px;${bg(t, aiBg)};color:${t.on};display:flex;flex-direction:column;align-items:center;padding-top:44px;gap:30px;overflow:hidden">
        <div style="font-size:${capsPH[i].length > 50 ? 40 : 48}px;font-weight:800;letter-spacing:-.03em;text-align:center;padding:0 80px;line-height:1.1">${esc(capsPH[i] || name)}</div>
        ${browserFrame(img, 1040)}</div>`, 1270, 760, P(`producthunt/gallery-${i + 1}-1270x760.png`));
    }

    /* App Store / Play screenshots from mobile captures */
    const mob = ["shots/mobile-hero.png", "shots/mobile-section-1.png", "shots/mobile-section-2.png"].filter((n) => s.screenshots.includes(n));
    const capsStore = [c.appStore.subtitle || headline, ...c.features.map((f) => f.title)];
    for (let i = 0; i < mob.length; i++) {
      const img = await dataUri(path.join(outDir, mob[i]));
      const cap = capsStore[i] || headline;
      await r.png(storeShot({ w: 1320, h: 2868, t, caption: cap, shot: img, aiBg }), 1320, 2868, P(`appstore/iphone-6.9-${i + 1}-1320x2868.png`));
      await r.png(storeShot({ w: 1080, h: 1920, t, caption: cap, shot: img, aiBg }), 1080, 1920, P(`play/phone-${i + 1}-1080x1920.png`));
    }
    await r.png(`<div style="width:1024px;height:500px;${bg(t, aiBg)};color:${t.on};display:flex;align-items:center;justify-content:center;gap:36px"><img src="${markUri}" style="width:180px;height:180px;border-radius:22%"/><div><div style="font-size:72px;font-weight:800;letter-spacing:-.03em">${esc(name)}</div><div style="font-size:30px;opacity:.85;max-width:620px">${esc(b.oneLiner.slice(0, 70))}</div></div></div>`, 1024, 500, P("play/feature-graphic-1024x500.png"));
    if (!b.platforms.some((p) => p === "ios" || p === "android")) notes.push("Web app: store screenshots are built from mobile-web captures (use them for marketing, or swap in real in-app screens before submitting to the stores).");
  } finally { await r.close(); }
  return { files, notes, aiImages, estUSD };
}
