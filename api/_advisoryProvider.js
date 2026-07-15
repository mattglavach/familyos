const CONTRACT = "familyos.advisory-response";

export class AdvisoryProviderError extends Error {
  constructor(category, message, status = 503) { super(message); this.name = "AdvisoryProviderError"; this.category = category; this.status = status; }
}

function extractJson(data) {
  const raw = data?.content?.find?.(item => item.type === "text")?.text || data?.output_text || "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new AdvisoryProviderError("invalid_response", "Provider response was not structured.");
  try { return JSON.parse(match[0]); } catch { throw new AdvisoryProviderError("invalid_response", "Provider response was not valid JSON."); }
}

export function createAdvisoryProvider(env = process.env) {
  const provider = String(env.AI_PROVIDER || "anthropic").toLowerCase();
  if (provider === "mock") return { name: "mock", async structuredCompletion(request) { return request.fallback; }, async streamText(request) { return request.fallback.summary; } };
  const apiKey = env.AI_PROVIDER_API_KEY || env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return {
    name: "anthropic",
    async structuredCompletion({ system, prompt, fallback, signal }) {
      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal, headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: env.AI_PROVIDER_MODEL || "claude-sonnet-4-6", max_tokens: 1800, temperature: 0, system, messages: [{ role: "user", content: `${prompt}\n\nReturn JSON only using contract ${CONTRACT}. Use this safe deterministic fallback as a shape example: ${JSON.stringify(fallback)}` }] }) });
      if (!response.ok) throw new AdvisoryProviderError(response.status === 429 ? "rate_limited" : "provider_error", "Provider request failed.", response.status);
      const data = await response.json(), value = extractJson(data);
      value.usage = data.usage ? { inputTokens: data.usage.input_tokens || 0, outputTokens: data.usage.output_tokens || 0 } : null;
      return value;
    },
    async streamText(request) { const value = await this.structuredCompletion(request); return value.summary || ""; },
  };
}

export function normalizeProviderError(error) {
  if (error?.name === "AbortError") return { category: "timeout", status: 504, message: "The advisory request timed out." };
  if (error instanceof AdvisoryProviderError) return { category: error.category, status: error.status, message: error.message };
  return { category: "provider_unavailable", status: 503, message: "The advisory service is unavailable." };
}
