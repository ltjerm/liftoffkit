import fs from "node:fs/promises";
import { launchBrowser } from "../lib/scrape.js";
import { Renderer } from "../lib/generate/visuals.js";
const b = await launchBrowser(); const r = new Renderer(b); await r.init();
let html = `<div style="display:grid;grid-template-columns:repeat(4,300px);gap:20px;padding:20px;background:#eee;font:16px sans-serif">`;
for (const s of ["plausible-io", "tally-so", "pika-style"]) for (const f of ["logo-mark-1024.png", "ai-candidate-1-1024.png", "ai-candidate-2-1024.png", "ai-candidate-3-1024.png"]) {
  const d = (await fs.readFile(`out/${s}/logo/${f}`)).toString("base64");
  html += `<div><img src="data:image/png;base64,${d}" style="width:300px;height:300px;background:#fff"/><div>${s} ${f.replace("-1024.png","")}</div></div>`;
}
await r.png(html + "</div>", 1300, 1060, "out/_logo-contact-sheet.png"); await r.close(); await b.close();
