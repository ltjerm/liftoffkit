import dns from "node:dns/promises";
import net from "node:net";

/** True if an IP is loopback, private, link-local, CGNAT, multicast, reserved, or metadata. */
export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||   // CGNAT
      (a === 169 && b === 254) ||             // link-local / cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||               // 192.0.0.0/24, 192.0.2.0/24
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224                                // multicast + reserved
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v) || v.startsWith("64:ff9b:") || v.startsWith("2001:db8");
  }
  return true; // not an IP -> treat as unsafe
}

/**
 * Dev-only escape hatch: some sandboxes (including the LiftoffKit build box) use fake-IP DNS that maps every
 * public hostname into 198.18.0.0/15 and tunnels egress through a proxy. Set LKIT_DEV_FAKEIP_EGRESS=1 there.
 * Never set this in production (Vercel resolves real IPs).
 */
function devFakeIpAllowed(ip: string): boolean {
  if (process.env.LKIT_DEV_FAKEIP_EGRESS !== "1" || process.env.NODE_ENV === "production") return false;
  const m = ip.match(/^198\.(18|19)\.\d+\.\d+$/);
  return !!m;
}

export class UnsafeUrlError extends Error {}

const hostCache = new Map<string, Promise<boolean>>();
export const clearHostCache = () => hostCache.clear();

/** Resolve a hostname and return true only if every address is public. */
export function isPublicHost(hostname: string): Promise<boolean> {
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostCache.has(h)) {
    hostCache.set(h, (async () => {
      if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return false;
      if (net.isIP(h)) return !isPrivateIp(h);
      try {
        const addrs = await dns.lookup(h, { all: true, verbatim: true });
        return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address) || devFakeIpAllowed(a.address));
      } catch { return false; }
    })());
  }
  return hostCache.get(h)!;
}

/** Validate a user-submitted URL. Throws UnsafeUrlError when it is not a public http(s) URL. */
export async function assertSafeUrl(raw: string): Promise<URL> {
  let u: URL;
  try { u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`); } catch { throw new UnsafeUrlError(`Invalid URL: ${raw}`); }
  if (!["http:", "https:"].includes(u.protocol)) throw new UnsafeUrlError(`Protocol not allowed: ${u.protocol}`);
  if (u.username || u.password) throw new UnsafeUrlError("Credentials in URL not allowed");
  if (u.port && !["80", "443"].includes(u.port)) throw new UnsafeUrlError(`Port not allowed: ${u.port}`);
  if (!(await isPublicHost(u.hostname))) throw new UnsafeUrlError(`Host resolves to a non-public address: ${u.hostname}`);
  return u;
}
