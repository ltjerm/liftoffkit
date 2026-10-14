"use client";

import { useEffect, useRef, useState } from "react";
import { URL_KEY } from "./checkout";

const SAMPLE = "tidyplate.app";

const FILES = [
  ["Reading your live site", "headless chrome"],
  ["brand.json", "colors · fonts · voice"],
  ["copy/landing.md", "5 headlines · FAQ · SEO"],
  ["logo/ + favicons", "svg · ico · 180 · 512"],
  ["social/og-1200x630.png", "+ X, LinkedIn, GitHub"],
  ["store/iphone-6.9-*.png", "framed screenshots"],
  ["legal/privacy.md · terms.md", "services detected"],
  ["launch/x-plan.csv", "7 days, timed"],
] as const;

const SWATCHES = ["#ff4d1a", "#14120f", "#f3efe6", "#2f6b4f"];

function hostOf(v: string | null) {
  if (!v) return null;
  try { return new URL(v).host.replace(/^www\./, ""); } catch { return null; }
}

// A looping, scripted "terminal" that types a URL and builds the kit line by line.
// If the visitor submits their own URL, the next run uses their domain.
export default function LaunchDemo() {
  const [domain, setDomain] = useState(SAMPLE);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(-1); // index of last finished file
  const [active, setActive] = useState(-1); // index currently generating
  const [zip, setZip] = useState(false);
  const run = useRef(0);

  useEffect(() => {
    const read = () => { try { const h = hostOf(sessionStorage.getItem(URL_KEY)); if (h) setDomain(h); } catch {} };
    read();
    window.addEventListener("lkit-url", read);
    return () => window.removeEventListener("lkit-url", read);
  }, []);

  useEffect(() => {
    const id = ++run.current;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => { if (run.current === id) fn(); }, ms));
    const full = `https://${domain}`;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(full); setActive(-1); setDone(FILES.length - 1); setZip(true);
      return;
    }

    const cycle = () => {
      setTyped(""); setDone(-1); setActive(-1); setZip(false);
      let t = 400;
      for (let i = 1; i <= full.length; i++) { const s = full.slice(0, i); at(t, () => setTyped(s)); t += 42 + (i % 4) * 14; }
      t += 450;
      FILES.forEach((_, i) => {
        at(t, () => setActive(i));
        t += i === 0 ? 1100 : 520 + (i % 3) * 140;
        at(t, () => { setDone(i); setActive(-1); });
        t += 90;
      });
      at(t + 250, () => setZip(true));
      at(t + 4200, cycle);
    };
    cycle();
    return () => { timers.forEach(clearTimeout); };
  }, [domain]);

  const zipName = `liftoffkit-${domain.split(".")[0]}.zip`;

  return (
    <div className="console" aria-label={`Example: LiftoffKit building a launch kit for ${domain}`} role="img">
      <div className="console-bar">
        <span className="dots"><i /><i /><i /></span>
        <span className="console-title">liftoffkit — build</span>
        <span className={`console-status${zip ? " ok" : ""}`}>{zip ? "READY" : active >= 0 || done >= 0 ? "BUILDING" : "IDLE"}</span>
      </div>
      <div className="console-body">
        <p className="console-prompt">
          <span className="prompt-sign">→</span>
          <span className="prompt-url">{typed}</span>
          <span className={`caret${typed.length && done < 0 && active < 0 ? "" : " blink"}`} />
        </p>
        <ul className="console-files">
          {FILES.map(([name, meta], i) => {
            const state = i <= done ? "done" : i === active ? "active" : "wait";
            return (
              <li key={name} className={state}>
                <span className="f-icon">{state === "done" ? "✓" : state === "active" ? "" : "·"}</span>
                <span className="f-name">{name}</span>
                {i === 1 && state === "done" ? (
                  <span className="f-swatches">{SWATCHES.map((c) => <i key={c} style={{ background: c }} />)}</span>
                ) : <span className="f-meta">{meta}</span>}
                <span className="f-bar"><i /></span>
              </li>
            );
          })}
        </ul>
        <div className={`console-zip${zip ? " show" : ""}`}>
          <span className="zip-icon">⇩</span>
          <span><strong>{zipName}</strong><small>sent to your inbox</small></span>
        </div>
      </div>
    </div>
  );
}
