import type { z } from "zod";

export const usage = { calls: 0, input: 0, cachedInput: 0, output: 0 };
/** gpt-5-mini list price (USD per 1M tokens): input 0.25, cached 0.025, output 2.00 — estimate only. */
export function estimateCostUSD(u = usage) { return ((u.input - u.cachedInput) * 0.25 + u.cachedInput * 0.025 + u.output * 2) / 1e6; }

export interface LLMProvider {
  readonly name: string;
  readonly available: boolean;
  lastError?: string;
  /** Returns parsed+validated JSON, or null when the provider is a stub or the call fails validation. */
  json<T>(args: { system: string; prompt: string; schema: z.ZodType<T>; maxTokens?: number }): Promise<T | null>;
}

class StubLLM implements LLMProvider {
  readonly name = "stub";
  readonly available = false;
  async json<T>(): Promise<T | null> { return null; }
}

class OpenAILLM implements LLMProvider {
  readonly name: string;
  available = true;
  lastError?: string;
  constructor(private key: string, private model: string, private baseUrl = "https://api.openai.com/v1") { this.name = `openai:${model}`; }
  async json<T>({ system, prompt, schema, maxTokens = 8000 }: { system: string; prompt: string; schema: z.ZodType<T>; maxTokens?: number }): Promise<T | null> {
    for (let attempt = 0; attempt < 4; attempt++) {
      let res: Response;
      try { res = await fetch(`${this.baseUrl}/chat/completions`, {
        signal: AbortSignal.timeout(Number(process.env.LLM_TIMEOUT_MS) || 120_000),
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.key}` },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          max_completion_tokens: maxTokens,
          ...(/^(gpt-5|o\d)/.test(this.model) ? { reasoning_effort: process.env.OPENAI_REASONING_EFFORT || "low" } : {}),
          messages: [{ role: "system", content: system + "\nRespond with a single JSON object only." }, { role: "user", content: prompt }],
        }),
      }); } catch (e) { this.lastError = `request failed: ${(e as Error).name}`; console.warn(`[llm] ${this.lastError}`); continue; }
      if (!res.ok) {
        const txt = await res.text();
        let code = ""; try { const e = JSON.parse(txt).error; code = e?.code || e?.type || ""; } catch {}
        this.lastError = `HTTP ${res.status}${code ? ` ${code}` : ""}`;
        console.warn(`[llm] ${this.name} ${this.lastError}`);
        // Fatal account errors: stop calling for the rest of the run and fall back to templates.
        if (res.status === 401 || /insufficient_quota|credit_balance_exhausted|billing/.test(code)) { this.available = false; return null; }
        if (res.status === 429 || res.status >= 500) {
          const ra = Number(res.headers.get("retry-after")) || 0;
          await new Promise((r) => setTimeout(r, Math.min(60_000, Math.max(ra * 1000, 5000 * 2 ** attempt))));
        }
        continue;
      }
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } } };
      usage.calls++; usage.input += body.usage?.prompt_tokens ?? 0; usage.output += body.usage?.completion_tokens ?? 0; usage.cachedInput += body.usage?.prompt_tokens_details?.cached_tokens ?? 0;
      try {
        const content = body.choices?.[0]?.message?.content ?? "";
        if (!content) { console.warn(`[llm] empty response (likely hit max tokens during reasoning)`); continue; }
        const parsed = schema.safeParse(JSON.parse(content));
        if (parsed.success) return parsed.data;
        console.warn(`[llm] schema validation failed: ${parsed.error.issues.slice(0, 4).map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ")}`);
      } catch (e) { console.warn(`[llm] bad JSON: ${(e as Error).message}`); }
    }
    return null;
  }
}

/** Reads keys from env. Missing key => stub (callers fall back to deterministic templates). */
export function getLLM(): LLMProvider {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return new StubLLM();
  return new OpenAILLM(key, process.env.OPENAI_MODEL || "gpt-5-mini", process.env.OPENAI_BASE_URL || undefined);
}
