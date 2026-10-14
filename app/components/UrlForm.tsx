"use client";

import { FormEvent, useState } from "react";
import { URL_KEY, isValidHttpUrl, normalize } from "./checkout";

type Props = { pricingHref?: string; buttonLabel?: string; className?: string };

export default function UrlForm({ pricingHref = "#pricing", buttonLabel = "Generate kit", className }: Props) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = normalize(url);
    if (!v || !isValidHttpUrl(v)) { setError(true); setMessage("Enter a valid http(s) URL — e.g. https://yourapp.com"); return; }
    setError(false);
    try { sessionStorage.setItem(URL_KEY, v); window.dispatchEvent(new Event("lkit-url")); } catch {}
    setMessage("Got it. Now pick a plan below to check out.");
    document.querySelector(pricingHref)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className={className}>
      <form className="url-form" onSubmit={onSubmit} noValidate>
        <input type="url" name="url" inputMode="url" autoComplete="url" placeholder="https://yourapp.com" value={url}
          onChange={(e) => { setUrl(e.target.value); if (message) setMessage(null); }} aria-label="Your app URL" />
        <button type="submit" className="btn btn-primary">{buttonLabel}</button>
      </form>
      <p className="form-hint">One-time payment via Stripe. <a href={pricingHref}>See pricing</a>.</p>
      {message ? <p className={`form-msg${error ? " error" : ""}`} role="status">{message}</p> : null}
    </div>
  );
}
