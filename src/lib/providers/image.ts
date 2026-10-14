export interface ImageRequest { prompt: string; model?: string; size?: string; colors?: string[]; style?: string }
export interface ImageResult { url: string; model: string }

export interface ImageProvider {
  readonly name: string;
  readonly available: boolean;
  lastError?: string;
  /** Returns null when the provider is a stub; callers must skip the asset and record why. */
  generate(req: ImageRequest): Promise<ImageResult | null>;
}

class StubImage implements ImageProvider {
  readonly name = "stub";
  readonly available = false;
  async generate(): Promise<null> { return null; }
}

/** fal.ai queue-less sync endpoint (https://fal.run/<model>). Used from M3 (logo/OG backgrounds). */
class FalImage implements ImageProvider {
  readonly name = "fal";
  available = true;
  lastError?: string;
  constructor(private key: string) {}
  async generate({ prompt, model = "fal-ai/recraft/v3/text-to-image", size = "square_hd", colors, style }: ImageRequest): Promise<ImageResult | null> {
    const input: Record<string, unknown> = { prompt, image_size: size };
    if (style) input.style = style;
    if (colors?.length) input.colors = colors.map((hex) => { const n = parseInt(hex.slice(1), 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 }; });
    const res = await fetch(`https://fal.run/${model}`, { method: "POST", headers: { authorization: `Key ${this.key}`, "content-type": "application/json" }, body: JSON.stringify(input) });
    if (!res.ok) {
      let detail = ""; try { detail = String((await res.json() as { detail?: unknown }).detail ?? "").slice(0, 120); } catch {}
      this.lastError = `HTTP ${res.status}${detail ? ` ${detail}` : ""}`;
      console.warn(`[image] fal ${this.lastError}`);
      if (res.status === 401 || res.status === 403) this.available = false; // locked / bad key: stop for this run
      return null;
    }
    const body = (await res.json()) as { images?: { url: string }[] };
    return body.images?.[0]?.url ? { url: body.images[0].url, model } : null;
  }
}

export function getImageProvider(): ImageProvider {
  const key = process.env.FAL_KEY?.trim();
  return key ? new FalImage(key) : new StubImage();
}
