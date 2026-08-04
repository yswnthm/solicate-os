import type { GenerateParams, ResponseFormat } from "../types";

// Opencode Zen exposes an OpenAI-compatible endpoint. We call it directly so
// the provider layer stays SDK-free and swappable. Base URL from the Zen docs:
// https://opencode.ai/docs/zen/
//
// Free-tier models have quirks we absorb here:
//  - Some reject `response_format: {"type": "json_object"}` with HTTP 400, so we
//    retry once without it when a JSON response is requested.
//  - Reasoning models can spend the whole token budget on reasoning and return
//    HTTP 200 with `content: null` (finish_reason "length"), or truncate the
//    answer mid-JSON. We retry with escalating budgets while responses stay cut
//    off, up to a generous cap.
//  - Some return the JSON wrapped in ```json fences, which we strip.
//  - Some return `content` as an array of parts instead of a string, which we
//    normalize.

const OPENCODE_ENDPOINT = "https://opencode.ai/zen/v1/chat/completions";

export function isOpencodeConfigured() {
  return Boolean(process.env.OPENCODE_API_KEY);
}

interface ChatResult {
  ok: boolean;
  status: number;
  body?: { choices?: { finish_reason?: string; message?: { content?: string } }[] };
  detail?: string;
}

async function chat(
  apiKey: string,
  opts: { model: string; system: string; userText: string; temperature: number; maxTokens: number; responseFormat?: ResponseFormat },
): Promise<ChatResult> {
  const response = await fetch(OPENCODE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      response_format: opts.responseFormat === "json_field" ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.userText },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false, status: response.status, detail };
  }
  const body = (await response.json()) as ChatResult["body"];
  return { ok: true, status: response.status, body };
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/.exec(trimmed);
  return fence ? fence[1].trim() : trimmed;
}

/** OpenAI-compatible endpoints may return content as a string or an array of parts. */
function contentOf(choice: { message?: { content?: string | Array<{ text?: string } | string> } } | undefined): string | undefined {
  const raw = choice?.message?.content;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    const joined = raw
      .map((part) => (typeof part === "string" ? part : part?.text ?? ""))
      .join("");
    return joined || undefined;
  }
  return undefined;
}

export async function generateOpencode(params: GenerateParams): Promise<string> {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new Error("OPENCODE_API_KEY is not configured.");

  const { system, user, model, temperature = 0.4, maxTokens = 2048, responseFormat } = params;
  const userText = JSON.stringify(user);

  const base = { model, system, userText, temperature, maxTokens, responseFormat };

  // Attempt 1 — as requested.
  let result = await chat(apiKey, base);

  // Retry: some free models reject json_object mode with HTTP 400.
  if (!result.ok && responseFormat === "json_field") {
    result = await chat(apiKey, { ...base, responseFormat: undefined });
  }

  if (!result.ok) {
    throw new Error(`Opencode request failed (${result.status}): ${(result.detail ?? "").slice(0, 300)}`);
  }

  let finishReason = result.body?.choices?.[0]?.finish_reason;
  let content = contentOf(result.body?.choices?.[0]);

  // Retry: a truncated or reasoning-starved response (finish_reason "length") is
  // unusable for JSON tasks. Escalate the budget until we get a complete answer
  // or we've hit the cap.
  let budget = Math.max(maxTokens * 2, 4096);
  for (let i = 0; i < 3 && finishReason === "length" && budget <= 16384; i++) {
    const retry = await chat(apiKey, { ...base, maxTokens: budget });
    if (!retry.ok) break;
    content = contentOf(retry.body?.choices?.[0]);
    finishReason = retry.body?.choices?.[0]?.finish_reason ?? "length";
    budget *= 2;
  }

  if (!content) {
    throw new Error(`Opencode returned an empty response (finish_reason: ${finishReason ?? "unknown"}).`);
  }

  return stripFences(content);
}
