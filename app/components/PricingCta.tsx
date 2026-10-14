"use client";

import { useEffect, useState } from "react";
import { URL_KEY, isValidHttpUrl, normalize, startCheckout } from "./checkout";

type Props = { tier: "liftoff" | "liftoff-plus"; label: string; featured?: boolean };

export default function PricingCta({ tier, label, featured }: Props) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = () => { try { const v = sessionStorage.getItem(URL_KEY); if (v) setUrl(v); } catch {} };
    load(); window.addEventListener("lkit-url", load);
    return () => window.removeEventListener("lkit-url", load);
  }, []);

  async function go() {
    const v = normalize(url);
    if (!isValidHttpUrl(v)) { setMsg("Enter your app's URL first."); return; }
    setBusy(true); setMsg(null);
    const err = await startCheckout(v, tier);
    if (err) { setMsg(err); setBusy(false); }
  }

  return (
    <div>
      <input type="url" className="cta-url" placeholder="https://yourapp.com" value={url} aria-label="Your app URL"
        onChange={(e) => { setUrl(e.target.value); setMsg(null); }} />
      <button type="button" className={`btn ${featured ? "btn-primary" : "btn-ghost"} btn-block`} onClick={go} disabled={busy} data-tier={tier}>
        {busy ? "Opening checkout…" : <>{label} <span className="btn-arrow" aria-hidden="true">→</span></>}
      </button>
      {msg ? <p className="form-msg error" role="status">{msg}</p> : null}
    </div>
  );
}
