export const URL_KEY = "lkit_app_url";
export function isValidHttpUrl(v: string) { try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; } }
export const normalize = (v: string) => { const t = v.trim(); return /^[a-z]+:\/\//i.test(t) ? t : t ? `https://${t}` : t; };
export async function startCheckout(url: string, tier: "liftoff" | "liftoff-plus"): Promise<string | null> {
  const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, tier }) });
  const j = await r.json().catch(() => ({}));
  if (r.ok && j.url) { window.location.href = j.url; return null; }
  return j.error || "Checkout failed — please try again.";
}
