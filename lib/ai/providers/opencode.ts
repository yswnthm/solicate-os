import type { GenerateParams } from "../types";

// Opencode Zen exposes an OpenAI-compatible endpoint. We call it directly so
// the provider layer stays SDK-free and swappable. Base URL from the Zen docs:
// https://opencode.ai/docs/zen/

const OPENCODE_ENDPOINT = "https://opencode.ai/zen/v1/chat/completions";

export function isOpencodeConfigured() {
  return Boolean(process.env.OPENCODE_API_KEY);
}

export async function generateOpencode({
  system,
  user,
  model,
  temperature = 0.4,
  maxTokens = 2048,
  responseFormat,
}: GenerateParams): Promise<string> {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new Error("OPENCODE_API_KEY is not configured.");

  const response = await fetch(OPENCODE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === "json_field" ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Opencode request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Opencode returned an empty response.");
  return content;
}
